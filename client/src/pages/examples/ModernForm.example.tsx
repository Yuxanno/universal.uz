/**
 * Modern Form Example
 * 
 * Демонстрация форм с новым дизайном:
 * - Чистые инпуты
 * - Красные focus states
 * - Валидация
 * - Accessibility
 */

import { useState } from 'react';
import { Mail, Lock, User, Phone } from 'lucide-react';
import Button from '../../components/ui/Button.modern';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card.modern';
import Input from '../../components/ui/Input.modern';
import Modal from '../../components/ui/Modal.modern';
import { ToastContainer } from '../../components/ui/Toast.modern';

export default function ModernFormExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      addToast('success', 'Форма успешно отправлена!');
    }, 2000);
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts([...toasts, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12">
      <div className="container-responsive max-w-2xl">
        {/* Registration Form */}
        <Card>
          <CardHeader title="Регистрация" />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Имя"
                placeholder="Введите ваше имя"
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="w-4 h-4" />}
                helperText="Мы никогда не передадим ваш email третьим лицам"
                required
              />

              <Input
                label="Телефон"
                type="tel"
                placeholder="+998 90 123 45 67"
                icon={<Phone className="w-4 h-4" />}
                required
              />

              <Input
                label="Пароль"
                type="password"
                placeholder="Минимум 8 символов"
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Подтвердите пароль"
                type="password"
                placeholder="Повторите пароль"
                icon={<Lock className="w-4 h-4" />}
                error="Пароли не совпадают"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="checkbox"
                  required
                />
                <label htmlFor="terms" className="text-sm text-neutral-600 dark:text-neutral-400">
                  Я согласен с{' '}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    условиями использования
                  </button>
                </label>
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" type="button">
              Отмена
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              loading={loading}
              onClick={handleSubmit}
            >
              Зарегистрироваться
            </Button>
          </CardFooter>
        </Card>

        {/* Login Form */}
        <Card className="mt-6">
          <CardHeader title="Вход" />
          <CardBody>
            <form className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                icon={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="checkbox"
                  />
                  <label htmlFor="remember" className="text-sm text-neutral-600 dark:text-neutral-400">
                    Запомнить меня
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Забыли пароль?
                </button>
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <Button variant="secondary" fullWidth>
              Войти
            </Button>
          </CardFooter>
        </Card>

        {/* Button Examples */}
        <Card className="mt-6">
          <CardHeader title="Примеры кнопок" />
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="primary" icon={<Mail className="w-4 h-4" />}>
                  With Icon
                </Button>
              </div>

              <Button variant="primary" fullWidth>
                Full Width
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Условия использования"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Принять
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            Добро пожаловать в наш сервис. Используя наш сайт, вы соглашаетесь с
            следующими условиями:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Вы предоставляете точную информацию при регистрации</li>
            <li>Вы не будете использовать сервис в незаконных целях</li>
            <li>Мы можем изменить условия в любое время</li>
            <li>Ваши данные защищены в соответствии с политикой конфиденциальности</li>
          </ul>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
