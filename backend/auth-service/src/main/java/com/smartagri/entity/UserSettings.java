package com.smartagri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private boolean emailNotifications = true;

    @Builder.Default
    private boolean smsNotifications = false;

    @Builder.Default
    private boolean pushNotifications = true;

    @Builder.Default
    private String language = "en";

    @Builder.Default
    private String theme = "light";

    @Builder.Default
    private boolean irrigationAlerts = true;

    @Builder.Default
    private boolean weatherAlerts = true;
}
