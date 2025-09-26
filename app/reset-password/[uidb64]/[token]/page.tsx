import ResetPasswordForm from '../../ResetPasswordForm';

type Params = {
  params: {
    uidb64: string;
    token: string;
  };
};

export default function ResetPasswordDynamicPage({ params }: Params) {
  const { uidb64, token } = params;
  return <ResetPasswordForm uidb64={uidb64} token={token} />;
}
