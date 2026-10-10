package com.smartagri.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsResponse {
    private boolean emailNotifications;
    private boolean smsNotifications;
    private boolean pushNotifications;
    private String language;
    private String theme;
    private boolean irrigationAlerts;
    private boolean weatherAlerts;
}
