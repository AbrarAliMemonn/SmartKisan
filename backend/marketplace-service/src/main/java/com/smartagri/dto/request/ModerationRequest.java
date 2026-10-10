package com.smartagri.dto.request;

import lombok.Data;

/** Generic admin moderation payload (reject/suspend) - reason is shown to the affected seller/buyer. */
@Data
public class ModerationRequest {
    private String reason;
}
