package products.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    // Helper: DataBuffer to byte array
    private byte[] toByteArray(DataBuffer dataBuffer) {
        ByteBuffer byteBuffer = dataBuffer.asByteBuffer();
        byte[] bytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(bytes);
        DataBufferUtils.release(dataBuffer);
        return bytes;
    }
}
