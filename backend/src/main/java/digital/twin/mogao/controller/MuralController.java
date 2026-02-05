package digital.twin.mogao.controller;

import digital.twin.mogao.dto.MuralDTO;
import digital.twin.mogao.service.MuralService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpStatus;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Mural REST Controller
 * Auto-generated from mogao_dt.ecore model
 */
@Controller("/murals")
public class MuralController {

    @Inject
    private MuralService muralService;

    /**
     * Get all Mural objects
     *
     * @return List of Mural DTOs
     */
    @Get
    public HttpResponse<List<MuralDTO>> getAllMurals() {
        List<MuralDTO> result = muralService.getAllMurals();
        return HttpResponse.ok(result);
    }

    /**
     * Get Mural by GID
     *
     * @param gid The GID of the Mural
     * @return Mural DTO
     */
    @Get("/{gid}")
    public HttpResponse<MuralDTO> getMuralByGid(@PathVariable String gid) {
        MuralDTO result = muralService.getMuralByGid(gid);
        if (result == null) {
            return HttpResponse.notFound();
        }
        return HttpResponse.ok(result);
    }

    /**
     * Create a new Mural
     *
     * @param dto The Mural DTO to create
     * @return Created Mural DTO
     */
    @Post
    @Status(HttpStatus.CREATED)
    public HttpResponse<MuralDTO> createMural(@Body MuralDTO dto) {
        MuralDTO created = muralService.createMural(dto);
        return HttpResponse.created(created);
    }

    /**
     * Update an existing Mural
     *
     * @param gid The GID of the Mural to update
     * @param dto The updated Mural DTO
     * @return No content on success
     */
    @Put("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> updateMural(@PathVariable String gid, @Body MuralDTO dto) {
        muralService.updateMural(gid, dto);
        return HttpResponse.noContent();
    }

    /**
     * Delete a Mural
     *
     * @param gid The GID of the Mural to delete
     * @return No content on success
     */
    @Delete("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> deleteMural(@PathVariable String gid) {
        muralService.deleteMural(gid);
        return HttpResponse.noContent();
    }
}
