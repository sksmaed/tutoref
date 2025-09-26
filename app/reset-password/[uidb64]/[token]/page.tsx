import ResetPasswordForm from '../../ResetPasswordForm';

type Params = {
  params: Promise<{
    uidb64: string;
    token: string;
  }>;
};

export default async function ResetPasswordDynamicPage({ params }: Params) {
  const { uidb64, token } = await params;
  return <ResetPasswordForm uidb64={uidb64} token={token} />;
}
