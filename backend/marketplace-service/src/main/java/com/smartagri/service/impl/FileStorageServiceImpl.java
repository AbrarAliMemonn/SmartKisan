package com.smartagri.service.impl;

import com.smartagri.dto.response.UploadResponse;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    /** Only real raster/vector image types - never executables or documents. */
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif");

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "gif");

    /** Folders the API is allowed to write into - stops path traversal via the folder segment. */
    private static final Set<String> ALLOWED_FOLDERS = Set.of(
            "products", "stores", "payments", "misc");

    private final Path rootLocation;
    private final String publicBaseUrl;

    public FileStorageServiceImpl(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.public-base-url:/api/marketplace/media/files}") String publicBaseUrl) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(rootLocation);
            for (String folder : ALLOWED_FOLDERS) {
                Files.createDirectories(rootLocation.resolve(folder));
            }
            log.info("Marketplace media storage ready at {}", rootLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Could not initialise upload directory: " + rootLocation, e);
        }
    }

    @Override
    public UploadResponse store(MultipartFile file, String folder) {
        String safeFolder = resolveFolder(folder);

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was uploaded");
        }

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());

        String extension = StringUtils.getFilenameExtension(originalName);
        extension = extension == null ? "" : extension.toLowerCase(Locale.ROOT);

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(
                    "Unsupported file type. Allowed image types: JPG, JPEG, PNG, WEBP, GIF");
        }

        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT);

        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Only image files can be uploaded");
        }

        // Random name: prevents collisions and stops a caller controlling the stored path.
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + extension;

        Path targetFolder = rootLocation.resolve(safeFolder).normalize();
        Path target = targetFolder.resolve(storedName).normalize();

        if (!target.startsWith(rootLocation)) {
            throw new BadRequestException("Invalid upload path");
        }

        try {
            Files.createDirectories(targetFolder);
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Failed to store uploaded file {}", originalName, e);
            throw new BadRequestException("Could not save the uploaded file. Please try again.");
        }

        return UploadResponse.builder()
                .url(publicBaseUrl + "/" + safeFolder + "/" + storedName)
                .fileName(storedName)
                .originalFileName(originalName)
                .contentType(contentType)
                .size(file.getSize())
                .build();
    }

    @Override
    public List<UploadResponse> storeAll(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files were uploaded");
        }
        if (files.size() > 8) {
            throw new BadRequestException("You can upload at most 8 images at a time");
        }
        return files.stream().map(f -> store(f, folder)).toList();
    }

    @Override
    public Resource loadAsResource(String folder, String fileName) {
        String safeFolder = resolveFolder(folder);
        String safeName = StringUtils.cleanPath(fileName);

        if (safeName.contains("..") || safeName.contains("/") || safeName.contains("\\")) {
            throw new BadRequestException("Invalid file name");
        }

        Path file = rootLocation.resolve(safeFolder).resolve(safeName).normalize();

        if (!file.startsWith(rootLocation)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("File not found: " + safeName);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found: " + safeName);
        }
    }

    @Override
    public String probeContentType(String fileName) {
        String ext = StringUtils.getFilenameExtension(fileName);
        if (ext == null) return "application/octet-stream";
        return switch (ext.toLowerCase(Locale.ROOT)) {
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "jpg", "jpeg" -> "image/jpeg";
            default -> "application/octet-stream";
        };
    }

    private String resolveFolder(String folder) {
        String candidate = (folder == null || folder.isBlank())
                ? "misc"
                : folder.toLowerCase(Locale.ROOT).trim();

        if (!ALLOWED_FOLDERS.contains(candidate)) {
            throw new BadRequestException(
                    "Invalid upload folder. Allowed: " + String.join(", ", ALLOWED_FOLDERS));
        }
        return candidate;
    }
}
