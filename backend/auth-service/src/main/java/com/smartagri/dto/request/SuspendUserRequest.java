package com.smartagri.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SuspendUserRequest {

    /** TEMPORARY or PERMANENT */
    @NotBlank
    private String type;

    /** Number of days for TEMPORARY suspension (e.g. 3, 7, 14, 30) */
    private Integer days;

    /** Reason for suspension */
    private String reason;
}
