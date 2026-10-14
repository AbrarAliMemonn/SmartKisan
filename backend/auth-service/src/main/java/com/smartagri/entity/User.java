package com.smartagri.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    /** Null for OAuth2-only accounts */
    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    @Builder.Default
    private UserType userType = UserType.FARMER;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    private String phone;

    private String location;

    @Column(name = "farm_size")
    private String farmSize;

    private String avatar;

    @Column(name = "is_seller", nullable = false)
    @Builder.Default
    private boolean seller = false;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    /**
     * False only for local sign-ups that have not yet confirmed their email
     * with an OTP. The column default keeps already existing rows verified.
     */
    @Column(name = "email_verified", nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private boolean emailVerified = true;

    @Column(name = "is_suspended", nullable = false)
    @Builder.Default
    private boolean suspended = false;

    @Column(name = "suspension_type")
    private String suspensionType; // TEMPORARY or PERMANENT

    @Column(name = "suspended_until")
    private Instant suspendedUntil;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
