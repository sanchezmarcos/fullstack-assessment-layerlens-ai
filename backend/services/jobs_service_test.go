package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/fullstack-assessment/backend/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ─── Mock: JobsRepository ────────────────────────────────────────────────────

type mockRepository struct {
	jobs      map[string]*models.Job
	createErr error
	getErr    error
	updateErr error
}

func newMockRepository() *mockRepository {
	return &mockRepository{jobs: make(map[string]*models.Job)}
}

func (m *mockRepository) Create(_ context.Context, job *models.Job) error {
	if m.createErr != nil {
		return m.createErr
	}
	job.ID = primitive.NewObjectID()
	job.CreatedAt = time.Now()
	job.UpdatedAt = time.Now()
	cp := *job
	m.jobs[job.ID.Hex()] = &cp
	return nil
}

func (m *mockRepository) GetByID(_ context.Context, id string) (*models.Job, error) {
	if m.getErr != nil {
		return nil, m.getErr
	}
	job, ok := m.jobs[id]
	if !ok {
		return nil, nil
	}
	cp := *job
	return &cp, nil
}

func (m *mockRepository) List(_ context.Context, _, _ int) ([]models.Job, int64, error) {
	return nil, 0, nil
}

func (m *mockRepository) UpdateStatus(_ context.Context, id string, status models.JobStatus) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	if job, ok := m.jobs[id]; ok {
		job.Status = status
	}
	return nil
}

func (m *mockRepository) UpdateStatusWithRetry(_ context.Context, id string, status models.JobStatus, retryCount int) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	if job, ok := m.jobs[id]; ok {
		job.Status = status
		job.RetryCount = retryCount
	}
	return nil
}

func (m *mockRepository) Update(_ context.Context, job *models.Job) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	cp := *job
	m.jobs[job.ID.Hex()] = &cp
	return nil
}

// ─── Mock: MessagePublisher ──────────────────────────────────────────────────

type publishedMsg struct {
	topic   string
	message interface{}
}

type mockPublisher struct {
	calls []publishedMsg
	err   error
}

func (m *mockPublisher) Publish(_ context.Context, topic string, message interface{}) error {
	if m.err != nil {
		return m.err
	}
	m.calls = append(m.calls, publishedMsg{topic: topic, message: message})
	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func newTestService(repo *mockRepository, pub *mockPublisher) JobsService {
	return &jobsService{repo: repo, producer: pub}
}

// seedJob inserts a job directly into the mock repo and returns its ID.
func seedJob(repo *mockRepository, status models.JobStatus, retryCount int) string {
	id := primitive.NewObjectID()
	repo.jobs[id.Hex()] = &models.Job{
		ID:         id,
		Name:       "seed-job",
		JobType:    models.JobTypeProcess,
		Status:     status,
		RetryCount: retryCount,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	return id.Hex()
}

// ─── CreateJob ───────────────────────────────────────────────────────────────

func TestCreateJob(t *testing.T) {
	tests := []struct {
		name      string
		req       CreateJobRequest
		wantErr   bool
		checkErr  func(t *testing.T, err error)
		checkJob  func(t *testing.T, job *models.Job)
		published int // expected Kafka messages
	}{
		{
			name:      "valid input creates job successfully",
			req:       CreateJobRequest{Name: "my-job", JobType: "process"},
			wantErr:   false,
			published: 1,
			checkJob: func(t *testing.T, job *models.Job) {
				t.Helper()
				if job.Name != "my-job" {
					t.Errorf("Name = %q, want %q", job.Name, "my-job")
				}
				if job.Status != models.JobStatusPending {
					t.Errorf("Status = %q, want pending", job.Status)
				}
				if job.JobType != models.JobTypeProcess {
					t.Errorf("JobType = %q, want process", job.JobType)
				}
			},
		},
		{
			name:    "invalid job_type returns ValidationError",
			req:     CreateJobRequest{Name: "my-job", JobType: "invalid"},
			wantErr: true,
			checkErr: func(t *testing.T, err error) {
				t.Helper()
				var valErr *ValidationError
				if !errors.As(err, &valErr) {
					t.Errorf("expected *ValidationError, got %T: %v", err, err)
				}
				if valErr != nil && valErr.Field != "job_type" {
					t.Errorf("Field = %q, want job_type", valErr.Field)
				}
			},
		},
		{
			name:    "missing name returns ValidationError",
			req:     CreateJobRequest{Name: "", JobType: "process"},
			wantErr: true,
			checkErr: func(t *testing.T, err error) {
				t.Helper()
				var valErr *ValidationError
				if !errors.As(err, &valErr) {
					t.Errorf("expected *ValidationError, got %T: %v", err, err)
				}
				if valErr != nil && valErr.Field != "name" {
					t.Errorf("Field = %q, want name", valErr.Field)
				}
			},
		},
		{
			name:      "kafka failure still returns job (non-fatal)",
			req:       CreateJobRequest{Name: "kafka-fail", JobType: "analyze"},
			wantErr:   false,
			published: 0, // error injected → nothing stored in mock calls
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := newMockRepository()
			pub := &mockPublisher{}
			if tc.name == "kafka failure still returns job (non-fatal)" {
				pub.err = errors.New("kafka down")
			}
			svc := newTestService(repo, pub)

			job, err := svc.CreateJob(context.Background(), tc.req)

			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				if tc.checkErr != nil {
					tc.checkErr(t, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tc.checkJob != nil {
				tc.checkJob(t, job)
			}
			if len(pub.calls) != tc.published {
				t.Errorf("Kafka publishes = %d, want %d", len(pub.calls), tc.published)
			}
			if tc.published > 0 && pub.calls[0].topic != "jobs" {
				t.Errorf("Kafka topic = %q, want jobs", pub.calls[0].topic)
			}
		})
	}
}

// ─── GetJob ──────────────────────────────────────────────────────────────────

func TestGetJob(t *testing.T) {
	tests := []struct {
		name    string
		setup   func(repo *mockRepository) string // returns the id to query
		wantErr error
	}{
		{
			name: "existing job is returned",
			setup: func(repo *mockRepository) string {
				return seedJob(repo, models.JobStatusPending, 0)
			},
		},
		{
			name: "non-existent job returns ErrJobNotFound",
			setup: func(_ *mockRepository) string {
				return primitive.NewObjectID().Hex()
			},
			wantErr: ErrJobNotFound,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := newMockRepository()
			svc := newTestService(repo, &mockPublisher{})

			id := tc.setup(repo)
			job, err := svc.GetJob(context.Background(), id)

			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Errorf("error = %v, want %v", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if job.ID.Hex() != id {
				t.Errorf("job ID = %q, want %q", job.ID.Hex(), id)
			}
		})
	}
}

// ─── CancelJob ───────────────────────────────────────────────────────────────

func TestCancelJob(t *testing.T) {
	tests := []struct {
		name           string
		seedStatus     models.JobStatus
		seedRetry      int
		nonExistent    bool
		wantErr        error
		wantStatus     models.JobStatus
		wantKafkaTopic string
	}{
		{
			name:           "pending job is cancelled successfully",
			seedStatus:     models.JobStatusPending,
			wantStatus:     models.JobStatusCancelling,
			wantKafkaTopic: "job_cancellations",
		},
		{
			name:           "processing job is cancelled successfully",
			seedStatus:     models.JobStatusProcessing,
			wantStatus:     models.JobStatusCancelling,
			wantKafkaTopic: "job_cancellations",
		},
		{
			name:       "completed job returns ErrInvalidJobState",
			seedStatus: models.JobStatusCompleted,
			wantErr:    ErrInvalidJobState,
		},
		{
			name:       "failed job returns ErrInvalidJobState",
			seedStatus: models.JobStatusFailed,
			wantErr:    ErrInvalidJobState,
		},
		{
			name:       "cancelled job returns ErrInvalidJobState",
			seedStatus: models.JobStatusCancelled,
			wantErr:    ErrInvalidJobState,
		},
		{
			name:        "non-existent job returns ErrJobNotFound",
			nonExistent: true,
			wantErr:     ErrJobNotFound,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := newMockRepository()
			pub := &mockPublisher{}
			svc := newTestService(repo, pub)

			var id string
			if tc.nonExistent {
				id = primitive.NewObjectID().Hex()
			} else {
				id = seedJob(repo, tc.seedStatus, tc.seedRetry)
			}

			job, err := svc.CancelJob(context.Background(), id)

			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Errorf("error = %v, want %v", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if job.Status != tc.wantStatus {
				t.Errorf("job status = %q, want %q", job.Status, tc.wantStatus)
			}
			// Verify Kafka message
			if len(pub.calls) != 1 {
				t.Fatalf("expected 1 Kafka publish, got %d", len(pub.calls))
			}
			if pub.calls[0].topic != tc.wantKafkaTopic {
				t.Errorf("Kafka topic = %q, want %q", pub.calls[0].topic, tc.wantKafkaTopic)
			}
			msg, ok := pub.calls[0].message.(CancellationMessage)
			if !ok {
				t.Fatalf("Kafka message type = %T, want CancellationMessage", pub.calls[0].message)
			}
			if msg.JobID != id {
				t.Errorf("CancellationMessage.JobID = %q, want %q", msg.JobID, id)
			}
			if msg.CancelledAt.IsZero() {
				t.Error("CancellationMessage.CancelledAt should not be zero")
			}
		})
	}
}

// ─── RetryJob ────────────────────────────────────────────────────────────────

func TestRetryJob(t *testing.T) {
	tests := []struct {
		name        string
		seedStatus  models.JobStatus
		seedRetry   int
		nonExistent bool
		wantErr     error
		wantRetry   int
	}{
		{
			name:       "failed job with 0 retries is retried",
			seedStatus: models.JobStatusFailed,
			seedRetry:  0,
			wantRetry:  1,
		},
		{
			name:       "failed job with 2 retries is retried",
			seedStatus: models.JobStatusFailed,
			seedRetry:  2,
			wantRetry:  3,
		},
		{
			name:       "failed job at max retries returns ErrMaxRetriesReached",
			seedStatus: models.JobStatusFailed,
			seedRetry:  3,
			wantErr:    ErrMaxRetriesReached,
		},
		{
			name:       "pending job cannot be retried",
			seedStatus: models.JobStatusPending,
			wantErr:    ErrInvalidJobState,
		},
		{
			name:       "completed job cannot be retried",
			seedStatus: models.JobStatusCompleted,
			wantErr:    ErrInvalidJobState,
		},
		{
			name:        "non-existent job returns ErrJobNotFound",
			nonExistent: true,
			wantErr:     ErrJobNotFound,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := newMockRepository()
			pub := &mockPublisher{}
			svc := newTestService(repo, pub)

			var id string
			if tc.nonExistent {
				id = primitive.NewObjectID().Hex()
			} else {
				id = seedJob(repo, tc.seedStatus, tc.seedRetry)
			}

			job, err := svc.RetryJob(context.Background(), id)

			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Errorf("error = %v, want %v", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if job.Status != models.JobStatusPending {
				t.Errorf("job status = %q, want pending", job.Status)
			}
			if job.RetryCount != tc.wantRetry {
				t.Errorf("RetryCount = %d, want %d", job.RetryCount, tc.wantRetry)
			}
			// Verify re-publish to jobs topic
			if len(pub.calls) != 1 {
				t.Fatalf("expected 1 Kafka publish, got %d", len(pub.calls))
			}
			if pub.calls[0].topic != "jobs" {
				t.Errorf("Kafka topic = %q, want jobs", pub.calls[0].topic)
			}
		})
	}
}
