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
    // Save to classes for immediate serving (relative to target/), and ../src for persistence
    private static final String CLASSPATH_DIR = "classes/exhibit_models/";
    private static final String SOURCE_DIR = "../src/main/resources/exhibit_models/";

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

            byte[] fileBytes = file.getBytes();

            // Save to target/classes for immediate serving
            Path classpathPath = Paths.get(CLASSPATH_DIR, subDir);
            Files.createDirectories(classpathPath);
            Path classpathFile = classpathPath.resolve(uniqueFilename);
            try (FileOutputStream fos = new FileOutputStream(classpathFile.toFile())) {
                fos.write(fileBytes);
            }

            // Also save to src/main/resources for persistence across rebuilds
            Path sourcePath = Paths.get(SOURCE_DIR, subDir);
            Files.createDirectories(sourcePath);
            Path sourceFile = sourcePath.resolve(uniqueFilename);
            try (FileOutputStream fos = new FileOutputStream(sourceFile.toFile())) {
                fos.write(fileBytes);
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
