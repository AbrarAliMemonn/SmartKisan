package com.smartagri.controller;

import com.smartagri.dto.response.ApiResponse;
import com.smartagri.dto.response.UploadResponse;
import com.smartagri.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

/**
 * Image upload for the marketplace, so sellers no longer have to paste an
 * external image URL.
 *
 * Uploading requires a logged-in user; reading a stored file is public
 * (product photos are shown on the public catalog).
 *
 * folder: products | stores | payments | misc
 */
@RestController
@RequestMapping("/marketplace/media")
@RequiredArgsConstructor
public class MediaController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "products") String folder) {
        return ApiResponse.success("Image uploaded", fileStorageService.store(file, folder));
    }

    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<UploadResponse>> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folder", defaultValue = "products") String folder) {
        return ApiResponse.success("Images uploaded", fileStorageService.storeAll(files, folder));
    }

    @GetMapping("/files/{folder}/{fileName:.+}")
    public ResponseEntity<Resource> serve(@PathVariable String folder, @PathVariable String fileName) {
        Resource resource = fileStorageService.loadAsResource(folder, fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileStorageService.probeContentType(fileName)))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
