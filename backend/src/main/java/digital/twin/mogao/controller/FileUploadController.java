/**
 * File Upload Controller Template
 * Handles file uploads for 3D models, textures, and metadata
 */
package digital.twin.mogao.controller;

import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.multipart.CompletedFileUpload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * File Upload Controller
 * Handles multipart file uploads for asset references
 * Auto-generated from code generator
 */
@Controller("/api/upload")
public class FileUploadController {

    private static final Logger LOG = LoggerFactory.getLogger(FileUploadController.class);
    private static final String UPLOAD_DIR = "src/main/resources/exhibit_models/";

    @Post(consumes = MediaType.MULTIPART_FORM_DATA, produces = MediaType.APPLICATION_JSON)
    public Map<String, String> upload(CompletedFileUpload file, String category) {
        Map<String, String> response = new HashMap<>();

        try {
            // Validate file
            if (file == null || file.getFilename().isEmpty()) {
                response.put("error", "No file uploaded");
                return response;
            }

            // Determine subdirectory based on category (model, texture, metadata)
            String subDir = category != null ? category : "general";

            // Generate unique filename to avoid conflicts
            String originalFilename = file.getFilename();
            String extension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalFilename.substring(dotIndex);
            }
            String uniqueFilename = UUID.randomUUID().toString() + extension;

            // Create directory structure
            Path uploadPath = Paths.get(UPLOAD_DIR, subDir);
            Files.createDirectories(uploadPath);

            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            File targetFile = filePath.toFile();

            try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                fos.write(file.getBytes());
            }

            // Return the server path
            String serverPath = "/exhibit_models/" + subDir + "/" + uniqueFilename;
            response.put("path", serverPath);
            response.put("originalName", originalFilename);
            response.put("size", String.valueOf(file.getSize()));

            LOG.info("File uploaded successfully: {} -> {}", originalFilename, serverPath);

        } catch (IOException e) {
            LOG.error("Failed to upload file", e);
            response.put("error", "Failed to upload file: " + e.getMessage());
        }

        return response;
    }
}
