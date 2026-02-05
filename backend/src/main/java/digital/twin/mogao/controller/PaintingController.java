package digital.twin.mogao.controller;

import digital.twin.mogao.dto.PaintingDTO;
import digital.twin.mogao.service.PaintingService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpStatus;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Painting REST Controller
 * Auto-generated from mogao_dt.ecore model
 */
@Controller("/paintings")
public class PaintingController {

    @Inject
    private PaintingService paintingService;

    /**
     * Get all Painting objects
     *
     * @return List of Painting DTOs
     */
    @Get
    public HttpResponse<List<PaintingDTO>> getAllPaintings() {
        List<PaintingDTO> result = paintingService.getAllPaintings();
        return HttpResponse.ok(result);
    }

    /**
     * Get Painting by GID
     *
     * @param gid The GID of the Painting
     * @return Painting DTO
     */
    @Get("/{gid}")
    public HttpResponse<PaintingDTO> getPaintingByGid(@PathVariable String gid) {
        PaintingDTO result = paintingService.getPaintingByGid(gid);
        if (result == null) {
            return HttpResponse.notFound();
        }
        return HttpResponse.ok(result);
    }

    /**
     * Create a new Painting
     *
     * @param dto The Painting DTO to create
     * @return Created Painting DTO
     */
    @Post
    @Status(HttpStatus.CREATED)
    public HttpResponse<PaintingDTO> createPainting(@Body PaintingDTO dto) {
        PaintingDTO created = paintingService.createPainting(dto);
        return HttpResponse.created(created);
    }

    /**
     * Update an existing Painting
     *
     * @param gid The GID of the Painting to update
     * @param dto The updated Painting DTO
     * @return No content on success
     */
    @Put("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> updatePainting(@PathVariable String gid, @Body PaintingDTO dto) {
        paintingService.updatePainting(gid, dto);
        return HttpResponse.noContent();
    }

    /**
     * Delete a Painting
     *
     * @param gid The GID of the Painting to delete
     * @return No content on success
     */
    @Delete("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> deletePainting(@PathVariable String gid) {
        paintingService.deletePainting(gid);
        return HttpResponse.noContent();
    }
}
