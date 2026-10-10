package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Returned by {@code /marketplace/media/upload}. {@code url} is what the
 * frontend stores in {@code ProductRequest.imageUrl} / {@code images[]} /
 * {@code storeLogoUrl} / {@code paymentProofUrl} - it is already a fully
 * usable, publicly readable URL, so nothing else needs to be assembled
 * client-side.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse {
    private String url;
    private String fileName;
    private String originalFileName;
    private String contentType;
    private long size;
}
