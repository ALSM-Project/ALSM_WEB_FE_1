import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsListPage } from './ProjectsListPage';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ROUTES } from '@/shared/constants/routes';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <ProjectsListPage />
      <CreateProjectModal
        isOpen={true}
        onClose={() => navigate(ROUTES.PROJECTS.LIST)}
      />
    </>
  );
};

export default CreateProjectPage;
