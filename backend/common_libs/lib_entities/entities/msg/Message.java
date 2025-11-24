package entities.msg;

public class Message {
    public long time = System.currentTimeMillis();
    public String user = "";
    public String lang = "vi";
    public String msgType = "";
    public int errorCode = 0;
    public boolean result = true;
    public String errorDesc = "";
    public String ip = "";
    public String localAddress = "";

}