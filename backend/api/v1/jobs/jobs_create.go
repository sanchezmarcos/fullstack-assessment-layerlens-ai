package jobs

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/fullstack-assessment/backend/api/shared"
	"github.com/fullstack-assessment/backend/services"
)

// createJob handles POST /api/v1/jobs
func (h *Handler) createJob(w http.ResponseWriter, r *http.Request) {
	var req services.CreateJobRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		shared.RespondError(w, http.StatusBadRequest, err)
		return
	}

	job, err := h.service.CreateJob(r.Context(), req)
	if err != nil {
		var validationErr *services.ValidationError
		if errors.As(err, &validationErr) {
			shared.RespondError(w, http.StatusBadRequest, err)
		} else {
			shared.RespondError(w, http.StatusInternalServerError, err)
		}
		return
	}

	shared.RespondJSON(w, http.StatusCreated, job)
}
