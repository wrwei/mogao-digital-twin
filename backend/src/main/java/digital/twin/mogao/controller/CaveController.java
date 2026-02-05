package digital.twin.mogao.controller;

import digital.twin.mogao.dto.CaveDTO;
import digital.twin.mogao.service.CaveService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpStatus;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Cave REST Controller
 * Auto-generated from mogao_dt.ecore model
 */
@Controller("/caves")
public class CaveController {

    @Inject
    private CaveService caveService;

    /**
     * Get all Cave objects
     *
     * @return List of Cave DTOs
     */
    @Get
    public HttpResponse<List<CaveDTO>> getAllCaves() {
        List<CaveDTO> result = caveService.getAllCaves();
        return HttpResponse.ok(result);
    }

    /**
     * Get Cave by GID
     *
     * @param gid The GID of the Cave
     * @return Cave DTO
     */
    @Get("/{gid}")
    public HttpResponse<CaveDTO> getCaveByGid(@PathVariable String gid) {
        CaveDTO result = caveService.getCaveByGid(gid);
        if (result == null) {
            return HttpResponse.notFound();
        }
        return HttpResponse.ok(result);
    }

    /**
     * Create a new Cave
     *
     * @param dto The Cave DTO to create
     * @return Created Cave DTO
     */
    @Post
    @Status(HttpStatus.CREATED)
    public HttpResponse<CaveDTO> createCave(@Body CaveDTO dto) {
        CaveDTO created = caveService.createCave(dto);
        return HttpResponse.created(created);
    }

    /**
     * Update an existing Cave
     *
     * @param gid The GID of the Cave to update
     * @param dto The updated Cave DTO
     * @return No content on success
     */
    @Put("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> updateCave(@PathVariable String gid, @Body CaveDTO dto) {
        caveService.updateCave(gid, dto);
        return HttpResponse.noContent();
    }

    /**
     * Delete a Cave
     *
     * @param gid The GID of the Cave to delete
     * @return No content on success
     */
    @Delete("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> deleteCave(@PathVariable String gid) {
        caveService.deleteCave(gid);
        return HttpResponse.noContent();
    }
}
