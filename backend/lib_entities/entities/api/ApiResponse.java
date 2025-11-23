package entities.api;

import entities.msg.Message;

public class ApiResponse {
    private String user;
    private boolean success;
    private int resultCode;
    private String description;
    private Message data;

    public String getUser() { return user;}
    public boolean getSuccess() { return success;}
    public int getResultCode() { return resultCode;}
    public void setResultCode(int resultCode, String description) {
        this.resultCode = resultCode;
        this.description = description;
    }
    public String getDescription() { return description;}
    public Message getData() { return data;}
    public void setData(Message data)  { this.data = data;}

}