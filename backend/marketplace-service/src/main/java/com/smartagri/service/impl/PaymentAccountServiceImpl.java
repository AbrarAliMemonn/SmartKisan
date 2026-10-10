package com.smartagri.service.impl;

import com.smartagri.dto.request.PaymentAccountRequest;
import com.smartagri.dto.response.PaymentAccountResponse;
import com.smartagri.entity.PaymentAccount;
import com.smartagri.entity.PaymentAccountType;
import com.smartagri.exception.BadRequestException;
import com.smartagri.exception.ResourceNotFoundException;
import com.smartagri.repository.PaymentAccountRepository;
import com.smartagri.service.PaymentAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentAccountServiceImpl implements PaymentAccountService {

    private final PaymentAccountRepository paymentAccountRepository;

    @Override
    @Transactional
    public PaymentAccountResponse create(Long ownerUserId, PaymentAccountRequest request) {
        PaymentAccount account = PaymentAccount.builder()
                .ownerUserId(ownerUserId)
                .type(parseType(request.getType()))
                .accountTitle(request.getAccountTitle())
                .accountNumber(request.getAccountNumber())
                .bankName(request.getBankName())
                .iban(request.getIban())
                .active(true)
                .build();
        return toResponse(paymentAccountRepository.save(account));
    }

    @Override
    public List<PaymentAccountResponse> getMyAccounts(Long ownerUserId) {
        return paymentAccountRepository.findByOwnerUserId(ownerUserId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public PaymentAccountResponse update(Long id, Long ownerUserId, PaymentAccountRequest request) {
        PaymentAccount account = getOwnedOrThrow(id, ownerUserId);
        account.setType(parseType(request.getType()));
        account.setAccountTitle(request.getAccountTitle());
        account.setAccountNumber(request.getAccountNumber());
        account.setBankName(request.getBankName());
        account.setIban(request.getIban());
        return toResponse(paymentAccountRepository.save(account));
    }

    @Override
    @Transactional
    public void deactivate(Long id, Long ownerUserId) {
        PaymentAccount account = getOwnedOrThrow(id, ownerUserId);
        account.setActive(false);
        paymentAccountRepository.save(account);
    }

    @Override
    public List<PaymentAccountResponse> getActiveAccountsForSeller(Long sellerUserId) {
        List<PaymentAccount> accounts = paymentAccountRepository.findByOwnerUserIdAndActiveTrue(sellerUserId);
        if (accounts.isEmpty()) {
            // Fall back to platform-level accounts so checkout always has somewhere to point the buyer.
            accounts = paymentAccountRepository.findByOwnerUserIdIsNullAndActiveTrue();
        }
        return accounts.stream().map(this::toResponse).toList();
    }

    private PaymentAccount getOwnedOrThrow(Long id, Long ownerUserId) {
        PaymentAccount account = paymentAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment account not found with id: " + id));
        if (account.getOwnerUserId() == null || !account.getOwnerUserId().equals(ownerUserId)) {
            throw new BadRequestException("You do not own this payment account");
        }
        return account;
    }

    private PaymentAccountType parseType(String value) {
        try {
            return PaymentAccountType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid payment account type: " + value);
        }
    }

    private PaymentAccountResponse toResponse(PaymentAccount a) {
        return PaymentAccountResponse.builder()
                .id(a.getId())
                .ownerUserId(a.getOwnerUserId())
                .type(a.getType().name())
                .accountTitle(a.getAccountTitle())
                .accountNumber(a.getAccountNumber())
                .bankName(a.getBankName())
                .iban(a.getIban())
                .active(a.isActive())
                .build();
    }
}
