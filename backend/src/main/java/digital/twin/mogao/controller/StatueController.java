package digital.twin.mogao.controller;

import digital.twin.mogao.dto.StatueDTO;
import digital.twin.mogao.service.StatueService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpStatus;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Statue REST Controller
 * Auto-generated from mogao_dt.ecore model
 */
@Controller("/statues")
public class StatueController {

    @Inject
    private StatueService statueService;

    /**
     * Get all Statue objects
     *
     * @return List of Statue DTOs
     */
    @Get
    public HttpResponse<List<StatueDTO>> getAllStatues() {
        List<StatueDTO> result = statueService.getAllStatues();
        return HttpResponse.ok(result);
    }

    /**
     * Get Statue by GID
     *
     * @param gid The GID of the Statue
     * @return Statue DTO
     */
    @Get("/{gid}")
    public HttpResponse<StatueDTO> getStatueByGid(@PathVariable String gid) {
        StatueDTO result = statueService.getStatueByGid(gid);
        if (result == null) {
            return HttpResponse.notFound();
        }
        return HttpResponse.ok(result);
    }

    /**
     * Create a new Statue
     *
     * @param dto The Statue DTO to create
     * @return Created Statue DTO
     */
    @Post
    @Status(HttpStatus.CREATED)
    public HttpResponse<StatueDTO> createStatue(@Body StatueDTO dto) {
        StatueDTO created = statueService.createStatue(dto);
        return HttpResponse.created(created);
    }

    /**
     * Update an existing Statue
     *
     * @param gid The GID of the Statue to update
     * @param dto The updated Statue DTO
     * @return No content on success
     */
    @Put("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> updateStatue(@PathVariable String gid, @Body StatueDTO dto) {
        statueService.updateStatue(gid, dto);
        return HttpResponse.noContent();
    }

    /**
     * Delete a Statue
     *
     * @param gid The GID of the Statue to delete
     * @return No content on success
     */
    @Delete("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> deleteStatue(@PathVariable String gid) {
        statueService.deleteStatue(gid);
        return HttpResponse.noContent();
    }
}
