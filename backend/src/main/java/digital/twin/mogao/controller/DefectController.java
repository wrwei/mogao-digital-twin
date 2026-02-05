package digital.twin.mogao.controller;

import digital.twin.mogao.dto.DefectDTO;
import digital.twin.mogao.service.DefectService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpStatus;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Defect REST Controller
 * Auto-generated from mogao_dt.ecore model
 */
@Controller("/defects")
public class DefectController {

    @Inject
    private DefectService defectService;

    /**
     * Get all Defect objects
     *
     * @return List of Defect DTOs
     */
    @Get
    public HttpResponse<List<DefectDTO>> getAllDefects() {
        List<DefectDTO> result = defectService.getAllDefects();
        return HttpResponse.ok(result);
    }

    /**
     * Get Defect by GID
     *
     * @param gid The GID of the Defect
     * @return Defect DTO
     */
    @Get("/{gid}")
    public HttpResponse<DefectDTO> getDefectByGid(@PathVariable String gid) {
        DefectDTO result = defectService.getDefectByGid(gid);
        if (result == null) {
            return HttpResponse.notFound();
        }
        return HttpResponse.ok(result);
    }

    /**
     * Create a new Defect
     *
     * @param dto The Defect DTO to create
     * @return Created Defect DTO
     */
    @Post
    @Status(HttpStatus.CREATED)
    public HttpResponse<DefectDTO> createDefect(@Body DefectDTO dto) {
        DefectDTO created = defectService.createDefect(dto);
        return HttpResponse.created(created);
    }

    /**
     * Update an existing Defect
     *
     * @param gid The GID of the Defect to update
     * @param dto The updated Defect DTO
     * @return No content on success
     */
    @Put("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> updateDefect(@PathVariable String gid, @Body DefectDTO dto) {
        defectService.updateDefect(gid, dto);
        return HttpResponse.noContent();
    }

    /**
     * Delete a Defect
     *
     * @param gid The GID of the Defect to delete
     * @return No content on success
     */
    @Delete("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> deleteDefect(@PathVariable String gid) {
        defectService.deleteDefect(gid);
        return HttpResponse.noContent();
    }
}
