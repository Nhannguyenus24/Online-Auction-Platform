package gateway.service;

import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    // Upload from byte array
    public Mono<String> upload(byte[] data, String folder) {
        return Mono.fromCallable(() -> {
                    Map<?, ?> result = cloudinary.uploader().upload(
                            data,
                            ObjectUtils.asMap(
                                    "folder", folder,
                                    "public_id", UUID.randomUUID().toString(),
                                    "resource_type", "auto"
                            )
                    );
                    return result.get("secure_url").toString();
                })
                .subscribeOn(Schedulers.boundedElastic())
                .timeout(Duration.ofSeconds(20));
    }

    // Upload from FilePart
    public Mono<String> upload(FilePart filePart, String folder) {
        return DataBufferUtils.join(filePart.content())
                .map(this::toByteArray)
                .flatMap(bytes -> upload(bytes, folder));
    }

    // Upload single image with default folder
    public Mono<String> upload(FilePart filePart) {
        return upload(filePart, "products");
    }

    // Upload multiple images (4 images in parallel)
    public Mono<List<String>> uploadMultiple(List<FilePart> files, String folder) {
        return Flux.fromIterable(files)
                .flatMap(file -> upload(file, folder), 4) // upload in parallel (4 images)
                .collectList();
    }

    // Upload multiple images (Flux)
    public Flux<String> uploadMultiple(Flux<FilePart> files, String folder) {
        return files
                .flatMap(file -> upload(file, folder), 4);
    }

    // Upload from base64 string
    public Mono<String> uploadBase64(String base64Data, String folder) {
        return Mono.fromCallable(() -> {
                    // Remove data:image/...;base64, prefix if present
                    String base64Clean = base64Data;
                    if (base64Data.contains(",")) {
                        base64Clean = base64Data.split(",")[1];
                    }
                    
                    byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Clean);
                    
                    Map<?, ?> result = cloudinary.uploader().upload(
                            imageBytes,
                            ObjectUtils.asMap(
                                    "folder", folder,
                                    "public_id", UUID.randomUUID().toString(),
                                    "resource_type", "auto"
                            )
                    );
                    return result.get("secure_url").toString();
                })
                .subscribeOn(Schedulers.boundedElastic())
                .timeout(Duration.ofSeconds(20));
    }

    // Upload multiple base64 images (max 4 in parallel)
    public Mono<List<String>> uploadMultipleBase64(List<String> base64List, String folder) {
        if (base64List == null || base64List.isEmpty()) {
            return Mono.just(List.of());
        }
        return Flux.fromIterable(base64List)
                .flatMap(base64 -> uploadBase64(base64, folder), 4)
                .collectList();
    }

    // Upload MultipartFile (for Spring MVC Servlet)
    public String uploadServlet(MultipartFile file, String folder) throws Exception {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "public_id", UUID.randomUUID().toString(),
                        "resource_type", "auto"
                )
        );
        return result.get("secure_url").toString();
    }

    // Upload multiple MultipartFiles (for Spring MVC Servlet) - synchronous
    public List<String> uploadMultipleServlet(List<MultipartFile> files, String folder) {
        return files.stream()
                .map(file -> {
                    try {
                        return uploadServlet(file, folder);
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to upload image: " + file.getOriginalFilename(), e);
                    }
                })
                .toList();
    }

    // Helper: DataBuffer to byte array
    private byte[] toByteArray(DataBuffer dataBuffer) {
        ByteBuffer byteBuffer = dataBuffer.asByteBuffer();
        byte[] bytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(bytes);
        DataBufferUtils.release(dataBuffer);
        return bytes;
    }
}
