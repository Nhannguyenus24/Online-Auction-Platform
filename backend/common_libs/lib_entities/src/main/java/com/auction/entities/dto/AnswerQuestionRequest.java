package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class AnswerQuestionRequest {
    
    @Schema(description = "Answer to the question", example = "This product is brand new and comes with a 1-year warranty.", required = true)
    private String answer;

    public AnswerQuestionRequest() {
    }

    public AnswerQuestionRequest(String answer) {
        this.answer = answer;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }
}
