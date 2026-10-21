const PT: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Confirme seu email antes de entrar. Verifique sua caixa de entrada.',
  'User already registered': 'Já existe uma conta com este email.',
  'Password should be at least 6 characters': 'A senha deve ter ao menos 6 caracteres.',
  'Unable to validate email address': 'Email inválido.',
  'User not found': 'Nenhuma conta encontrada com este email.',
  'Email rate limit exceeded': 'Muitos emails enviados. Aguarde 1 hora e tente novamente.',
  rate_limit_email_sent: 'Muitos emails enviados. Aguarde 1 hora e tente novamente.',
  'duplicate key value violates unique constraint "profiles_apelido_key"': 'Este apelido já está em uso. Escolha outro.',
  'New password should be different from the old password': 'A nova senha deve ser diferente da atual.',
  'For security purposes, you can only request this once every': 'Muitos pedidos. Aguarde um pouco e tente novamente.',
};

export function ptError(err: { message?: string } | null): string {
  if (!err) return '';
  const msg = err.message || '';
  for (const [k, v] of Object.entries(PT)) {
    if (msg.includes(k)) return v;
  }
  return msg || 'Algo deu errado.';
}
