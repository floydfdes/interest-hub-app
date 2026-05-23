'use client';

import { Button, Card, Form, Input, message, Select, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost, getErrorMessage } from '@/app/api/api';
import { IPost } from '@/app/types/user';

const { Title } = Typography;
const { TextArea } = Input;

interface PostFormValues {
    title: string;
    content: string;
    category: string;
    visibility: IPost['visibility'];
}

const PostForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const getBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });

    const onFinish = async (values: PostFormValues) => {
        const originalImage = fileList[0]?.originFileObj as File | undefined;
        if (!originalImage) {
            message.error('Please select an image.');
            return;
        }

        setLoading(true);
        try {
            const compressedImage = await imageCompression(originalImage, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            const image = await getBase64(compressedImage);

            await createPost({ ...values, image });
            message.success('Post created successfully!');
            router.push('/');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to create post'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = ({ fileList: nextFileList }: UploadChangeParam<UploadFile>) => {
        setFileList(nextFileList);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-md">
            <Title level={3} className="text-center mb-6">Create New Post</Title>
            <Form<PostFormValues>
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ visibility: 'public' }}
            >
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please add a title.' }]}
                >
                    <Input placeholder="What is this interest about?" />
                </Form.Item>
                <Form.Item
                    label="Content"
                    name="content"
                    rules={[{ required: true, message: 'Please write something!' }]}
                >
                    <TextArea rows={4} placeholder="What's on your mind?" showCount maxLength={500} />
                </Form.Item>
                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please add a category.' }]}
                >
                    <Input placeholder="For example: Photography" />
                </Form.Item>
                <Form.Item label="Visibility" name="visibility">
                    <Select
                        options={[
                            { value: 'public', label: 'Public' },
                            { value: 'followersOnly', label: 'Followers only' },
                            { value: 'private', label: 'Private' },
                        ]}
                    />
                </Form.Item>
                <Form.Item label="Image" required>
                    <Upload
                        listType="picture"
                        fileList={fileList}
                        onChange={handleChange}
                        beforeUpload={() => false}
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />}>Select Image</Button>
                    </Upload>
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={fileList.length === 0}
                        block
                        size="large"
                    >
                        Post
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default PostForm;
