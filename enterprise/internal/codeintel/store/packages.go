package store

import (
	"context"

	"github.com/keegancsmith/sqlf"
	"github.com/sourcegraph/sourcegraph/enterprise/internal/codeintel/bundles/types"
)

// GetPackage returns the dump that provides the package with the given scheme, name, and version and a flag indicating its existence.
func (s *store) GetPackage(ctx context.Context, scheme, name, version string) (Dump, bool, error) {
	return scanFirstDump(s.query(ctx, sqlf.Sprintf(`
		SELECT
			d.id,
			d.commit,
			d.root,
			EXISTS (SELECT 1 FROM lsif_uploads_visible_at_tip where repository_id = d.repository_id and upload_id = d.id) AS visible_at_tip,
			d.uploaded_at,
			d.state,
			d.failure_message,
			d.started_at,
			d.finished_at,
			d.process_after,
			d.num_resets,
			d.repository_id,
			d.repository_name,
			d.indexer
		FROM lsif_packages p
		JOIN lsif_dumps_with_repository_name d ON d.id = p.dump_id
		WHERE p.scheme = %s AND p.name = %s AND p.version = %s
		ORDER BY d.uploaded_at DESC
		LIMIT 1
	`, scheme, name, version)))
}

// UpdatePackages upserts package data tied to the given upload.
func (s *store) UpdatePackages(ctx context.Context, packages []types.Package) (err error) {
	if len(packages) == 0 {
		return nil
	}

	var values []*sqlf.Query
	for _, p := range packages {
		values = append(values, sqlf.Sprintf("(%s, %s, %s, %s)", p.DumpID, p.Scheme, p.Name, p.Version))
	}

	return s.queryForEffect(ctx, sqlf.Sprintf(`INSERT INTO lsif_packages (dump_id, scheme, name, version) VALUES %s`, sqlf.Join(values, ",")))
}
