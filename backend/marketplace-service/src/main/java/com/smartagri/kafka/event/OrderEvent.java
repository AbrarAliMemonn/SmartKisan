package com.smartagri.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

/** Published whenever an order is created or its status changes, for downstream notification handling. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent implements Serializable {
    private Long orderId;
    private Long buyerId;
    private Long sellerId;
    private String status;
    private BigDecimal totalAmount;
    private Instant timestamp;
}
