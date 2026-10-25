import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ProjectEntity } from '../../types/project';

interface ProjectCardProps {
  project: ProjectEntity;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <article className="gd-card gd-project-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Cover Image & Badges */}
      <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}>
        <img
          src={project.coverImage}
          alt={project.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
          className="gd-project-image"
        />

        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span
            className="gd-status-tag"
            style={{
              backgroundColor: project.status === 'Ready to Move' ? '#10b981' : '#f59e0b',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '11.5px',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            {project.status}
          </span>
          <span
            className="gd-status-tag"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              backdropFilter: 'blur(4px)',
            }}
          >
            By {project.developer}
          </span>
        </div>

        {/* Demo Record Notice */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.65)',
            color: '#e2e8f0',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)',
          }}
        >
          Curated Benchmark Project
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Title & Location */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.3 }}>
            <Link to={`/project/${project.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {project.name}
            </Link>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gd-text-muted)', fontSize: '13px' }}>
            <MapPin size={14} color="var(--gd-terra-500)" />
            <span>{project.locality}, {project.city}</span>
          </div>
        </div>

        {/* Pricing Range */}
        <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: 'var(--gd-radius-md)', backgroundColor: 'rgba(235, 94, 40, 0.05)', border: '1px solid rgba(235, 94, 40, 0.15)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--gd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Starting Price Band
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gd-terra-600)' }}>
            {project.priceRangeFormatted}
          </div>
        </div>

        {/* Configurations Available */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gd-text-muted)', marginBottom: '6px' }}>
            Configurations:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {project.configurations.map((cfg) => (
              <span
                key={cfg.bhk}
                style={{
                  fontSize: '11.5px',
                  backgroundColor: 'var(--gd-surface-elevated)',
                  border: '1px solid var(--gd-border)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  color: 'var(--gd-text-primary)',
                }}
              >
                {cfg.bhk} ({cfg.carpetAreaSqft} sqft) • {cfg.priceFormatted}
              </span>
            ))}
          </div>
        </div>

        {/* Verified RERA Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--gd-text-muted)',
            backgroundColor: 'var(--gd-surface-elevated)',
            padding: '8px 10px',
            borderRadius: '6px',
            marginBottom: '16px',
            lineHeight: 1.4,
          }}
        >
          <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{project.reraStatus}</span>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--gd-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gd-text-muted)' }}>
            <Calendar size={13} />
            <span>Possession: {project.possessionDate}</span>
          </div>

          <Link
            to={`/project/${project.slug}`}
            className="gd-btn gd-btn-primary"
            style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>View Project</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
};
