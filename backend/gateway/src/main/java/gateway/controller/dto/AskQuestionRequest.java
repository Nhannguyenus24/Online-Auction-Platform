package gateway.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to ask a question about a product")
public record AskQuestionRequest(
    @Schema(description = "Question text", required = true, example = "What is the condition of this item?")
    String question
) {}
