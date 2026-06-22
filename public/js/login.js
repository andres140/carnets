/**
 * Login — Módulo de Autenticación (Frontend)
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('alertBox');
  const btnLogin = document.getElementById('btnLogin');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  function showError(msg) {
    alertBox.textContent = msg;
    alertBox.classList.remove('d-none');
  }

  function hideError() {
    alertBox.classList.add('d-none');
  }

  function setLoading(loading) {
    btnLogin.disabled = loading;
    btnText.textContent = loading ? 'Ingresando...' : 'Iniciar sesión';
    btnSpinner.classList.toggle('d-none', !loading);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showError('Complete todos los campos');
        return;
      }

      const result = await API.post('/api/auth/login', { email, password });

      if (result.success) {
        window.location.href = '/dashboard.html';
      } else {
        showError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      showError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  });
});
