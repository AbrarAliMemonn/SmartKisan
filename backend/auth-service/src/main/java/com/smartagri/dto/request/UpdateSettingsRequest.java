package com.smartagri.dto.request;

import lombok.Data;

@Data
public class UpdateSettingsRequest {
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private Boolean pushNotifications;
    private String language;
    private String theme;
    private Boolean irrigationAlerts;
    private Boolean weatherAlerts;
}
