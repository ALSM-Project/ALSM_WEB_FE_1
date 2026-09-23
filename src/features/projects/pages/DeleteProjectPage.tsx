import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { ProjectsListPage } from './ProjectsListPage';
import { DeleteProjectModal } from '../components/DeleteProjectModal';

export const DeleteProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(ROUTES.PROJECTS.LIST);
  };

  return (
    <>
      <ProjectsListPage />
      {projectId && (
        <DeleteProjectModal
          isOpen={true}
          projectId={projectId}
          onClose={handleClose}
          onDeleted={handleClose}
        />
      )}
    </>
  );
};

export default DeleteProjectPage;
