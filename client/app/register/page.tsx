'use client';

import { getErrorMessage, registerUser } from '@/app/api/api';
import { notifyAuthChanged } from '@/app/hooks/useCurrentUser';
import { RegisterInput } from '@/app/types/user';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title, Text } = Typography;

const Register = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    const onFinish = async (values: RegisterInput) => {
        setLoading(true);
        try {
            const response = await registerUser(values);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            notifyAuthChanged();
            message.success('Registration successful!');
            router.push('/');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="shell-container grid min-h-[calc(100vh-14rem)] items-center gap-10 lg:grid-cols-[1fr_29rem]">
            <section className="hidden max-w-lg lg:block">
                <span className="eyebrow"><Sparkles size={12} /> Start sharing</span>
                <h1 className="gradient-heading mt-5 text-5xl font-bold leading-[1.08]">
                    Your interests deserve a place to grow.
                </h1>
                <p className="mt-5 text-lg leading-8 text-slate-500">
                    Create a profile, find your people, and turn passing inspiration into conversation.
                </p>
            </section>
            <Card className="!rounded-[1.75rem] !border-slate-100 !shadow-[0_26px_60px_-34px_rgba(30,41,59,0.3)]">
                <div className="mb-8">
                    <span className="eyebrow lg:hidden">Start sharing</span>
                    <Title level={2} className="!mb-2 !mt-4 !tracking-tight !text-slate-900">Create account</Title>
                    <Text className="!text-slate-500">Join InterestHub in seconds.</Text>
                </div>
                <Form
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="name"
                        rules={[{ required: true, message: 'Please input your name!' }]}
                    >
                        <Input className="soft-input" prefix={<UserOutlined className="text-slate-400" />} placeholder="Your name" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email!' },
                        ]}
                    >
                        <Input className="soft-input" prefix={<MailOutlined className="text-slate-400" />} placeholder="Email address" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password className="soft-input" prefix={<LockOutlined className="text-slate-400" />} placeholder="Create a password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading} className="!h-12 !rounded-xl !font-semibold">
                            Create account <ArrowRight size={15} />
                        </Button>
                    </Form.Item>
                    <div className="text-center">
                        <Text>Already have an account? </Text>
                        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Log in
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;
