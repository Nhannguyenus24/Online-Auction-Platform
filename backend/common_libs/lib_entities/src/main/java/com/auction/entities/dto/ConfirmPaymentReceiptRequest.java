package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class ConfirmPaymentReceiptRequest {
    
    @Schema(description = "Invoice number", example = "INV-2024-001")
    private String invoiceNumber;
    
    @Schema(description = "Payment confirmation notes", example = "Payment received via bank transfer")
    private String paymentConfirmationNotes;

    public ConfirmPaymentReceiptRequest() {
    }

    public ConfirmPaymentReceiptRequest(String invoiceNumber, String paymentConfirmationNotes) {
        this.invoiceNumber = invoiceNumber;
        this.paymentConfirmationNotes = paymentConfirmationNotes;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getPaymentConfirmationNotes() {
        return paymentConfirmationNotes;
    }

    public void setPaymentConfirmationNotes(String paymentConfirmationNotes) {
        this.paymentConfirmationNotes = paymentConfirmationNotes;
    }
}
