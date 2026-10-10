package com.smartagri.service;

import com.smartagri.dto.response.UploadResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Local-disk image storage for marketplace media (product photos, store logos,
 * manual-payment proofs). Deliberately filesystem-based - no S3/Cloudinary
 * account or paid service is required to run the project.
 */
public interface FileStorageService {

    UploadResponse store(MultipartFile file, String folder);

    List<UploadResponse> storeAll(List<MultipartFile> files, String folder);

    Resource loadAsResource(String folder, String fileName);

    String probeContentType(String fileName);
}
