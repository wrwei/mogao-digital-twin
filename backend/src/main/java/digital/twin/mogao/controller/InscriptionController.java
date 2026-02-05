package digital.twin.mogao.controller;

import digital.twin.mogao.dto.InscriptionDTO;
import digital.twin.mogao.service.InscriptionService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.HttpStatus;
import jakarta.inject.Inject;

import java.util.List;

/**
 * Inscription REST Controller
 * Auto-generated from mogao_dt.ecore model
 */
@Controller("/inscriptions")
public class InscriptionController {

    @Inject
    private InscriptionService inscriptionService;

    /**
     * Get all Inscription objects
     *
     * @return List of Inscription DTOs
     */
    @Get
    public HttpResponse<List<InscriptionDTO>> getAllInscriptions() {
        List<InscriptionDTO> result = inscriptionService.getAllInscriptions();
        return HttpResponse.ok(result);
    }

    /**
     * Get Inscription by GID
     *
     * @param gid The GID of the Inscription
     * @return Inscription DTO
     */
    @Get("/{gid}")
    public HttpResponse<InscriptionDTO> getInscriptionByGid(@PathVariable String gid) {
        InscriptionDTO result = inscriptionService.getInscriptionByGid(gid);
        if (result == null) {
            return HttpResponse.notFound();
        }
        return HttpResponse.ok(result);
    }

    /**
     * Create a new Inscription
     *
     * @param dto The Inscription DTO to create
     * @return Created Inscription DTO
     */
    @Post
    @Status(HttpStatus.CREATED)
    public HttpResponse<InscriptionDTO> createInscription(@Body InscriptionDTO dto) {
        InscriptionDTO created = inscriptionService.createInscription(dto);
        return HttpResponse.created(created);
    }

    /**
     * Update an existing Inscription
     *
     * @param gid The GID of the Inscription to update
     * @param dto The updated Inscription DTO
     * @return No content on success
     */
    @Put("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> updateInscription(@PathVariable String gid, @Body InscriptionDTO dto) {
        inscriptionService.updateInscription(gid, dto);
        return HttpResponse.noContent();
    }

    /**
     * Delete a Inscription
     *
     * @param gid The GID of the Inscription to delete
     * @return No content on success
     */
    @Delete("/{gid}")
    @Status(HttpStatus.NO_CONTENT)
    public HttpResponse<Void> deleteInscription(@PathVariable String gid) {
        inscriptionService.deleteInscription(gid);
        return HttpResponse.noContent();
    }
}
