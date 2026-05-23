'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getErrorMessage, registerUser } from '@/app/api/api';
import { notifyAuthChanged } from '@/app/hooks/useCurrentUser';
import { RegisterInput } from '@/app/types/user';

const { Title, Text } = Typography;

const Register = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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
        <div className="flex justify-center items-center min-h-[80vh]">
            <Card className="w-full max-w-md shadow-lg rounded-xl">
                <div className="text-center mb-8">
                    <Title level={2} className="!mb-2">Join InterestHub</Title>
                    <Text type="secondary">Create an account to start sharing</Text>
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
                        <Input prefix={<UserOutlined />} placeholder="Name" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email!' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Register
                        </Button>
                    </Form.Item>
                    <div className="text-center">
                        <Text>Already have an account? </Text>
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Login
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Register;
