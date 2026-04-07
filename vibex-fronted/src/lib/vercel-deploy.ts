export interface VercelDeployment {
  url: string;
  id: string;
  status: 'BUILDING' | 'READY' | 'ERROR';
  createdAt: string;
}

export interface DeployOptions {
  projectId: string;
  framework: string;
  token: string;
}

export async function deployToVercel(options: DeployOptions): Promise<VercelDeployment> {
  const { projectId, framework, token } = options;
  
  const response = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `vibex-${projectId}`,
      project: projectId,
      framework,
      target: 'production',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Deployment failed: ${response.status}`);
  }
  
  return response.json() as Promise<VercelDeployment>;
}
