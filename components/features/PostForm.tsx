'use client';

import { createDraftPost, createPost, getErrorMessage } from '@/app/api/api';
import { compressAndConvertToBase64 } from '@/app/api/imageUtil';
import { getModerationNoticeMessage } from '@/app/utils/moderation';
import { IPost } from '@/app/types/user';
import { UploadOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Select, Typography, Upload } from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { ImagePlus, Sparkles } from 'lucide-react';
import MentionSuggestions from './MentionSuggestions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title } = Typography;
const { TextArea } = Input;
const DEFAULT_POST_IMAGE = '/default_image.png';
const categories = ['Tech', 'Health', 'Travel', 'Design', 'Education'];

interface PostFormValues {
    title: string;
    content: string;
    category: string;
    visibility: IPost['visibility'];
}

const PostForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const { message } = App.useApp();
    const [form] = Form.useForm<PostFormValues>();

    const getSelectedImage = async () => {
        const originalImage = fileList[0]?.originFileObj as File | undefined;
        if (!originalImage) return '';
        return await compressAndConvertToBase64(originalImage);
    };

    const saveDraft = async () => {
        const values = form.getFieldsValue();
        setSavingDraft(true);
        try {
            const image = await getSelectedImage();
            await createDraftPost({
                title: values.title || '',
                content: values.content || '',
                category: values.category || '',
                image: image || '',
                visibility: values.visibility || 'public',
            });
            message.success('Draft saved');
            router.push('/profile/drafts');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to save draft'));
        } finally {
            setSavingDraft(false);
        }
    };

    const onFinish = async (values: PostFormValues) => {
        const originalImage = fileList[0]?.originFileObj as File | undefined;

        setLoading(true);
        try {
            const image = originalImage
                ? await compressAndConvertToBase64(originalImage)
                : await compressAndConvertToBase64(DEFAULT_POST_IMAGE);
            if (!image) {
                message.error('Failed to process image.');
                return;
            }

            const response = await createPost({
                ...values,
                image,
            });
            const moderationMessage = getModerationNoticeMessage(response);
            if (moderationMessage) {
                message.warning(moderationMessage);
            } else {
                message.success('Post created successfully!');
            }
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
        <Card className="mx-auto w-full max-w-3xl !rounded-[1.75rem] !border-slate-100 !p-1 !shadow-[0_24px_60px_-34px_rgba(30,41,59,0.25)]">
            <div className="mb-8">
                <span className="eyebrow"><Sparkles size={12} /> New post</span>
                <Title level={2} className="!mb-2 !mt-4 !tracking-tight !text-slate-900">Share an interest</Title>
                <p className="text-slate-500">Tell your community what you have been exploring lately.</p>
            </div>
            <Form<PostFormValues>
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ visibility: 'public' }}
            >
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please add a title.' }]}
                >
                    <Input data-testid="post-title" className="soft-input" placeholder="What is this interest about?" />
                </Form.Item>
                <Form.Item label="Content" required>
                    <Form.Item
                        name="content"
                        rules={[{ required: true, message: 'Please write something!' }]}
                        noStyle
                    >
                        <TextArea data-testid="post-content" className="soft-input !min-h-36 !p-4" rows={5} placeholder="What's on your mind? Use @username or #tag" showCount maxLength={500} />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(previous, current) => previous.content !== current.content}>
                        {({ getFieldValue, setFieldValue }) => (
                            <MentionSuggestions
                                value={getFieldValue('content') || ''}
                                onChange={(nextValue) => setFieldValue('content', nextValue)}
                            />
                        )}
                    </Form.Item>
                </Form.Item>
                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please select a category.' }]}
                >
                    <Select
                        data-testid="post-category"
                        className="!h-12"
                        placeholder="Select Category"
                        options={categories.map((category) => ({ value: category, label: category }))}
                    />
                </Form.Item>
                <Form.Item label="Visibility" name="visibility">
                    <Select
                        data-testid="post-visibility"
                        className="!h-12"
                        options={[
                            { value: 'public', label: 'Public' },
                            { value: 'followersOnly', label: 'Followers only' },
                            { value: 'private', label: 'Only me' },
                        ]}
                    />
                </Form.Item>
                <Form.Item label="Cover image">
                    <Upload
                        data-testid="post-image-upload"
                        listType="picture"
                        fileList={fileList}
                        onChange={handleChange}
                        beforeUpload={() => false}
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button data-testid="post-image-select" icon={<UploadOutlined />} className="!h-12 !rounded-xl">Select image</Button>
                    </Upload>
                    {fileList.length === 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            <ImagePlus size={16} />
                            No image selected. The default cover image will be used.
                        </div>
                    )}
                </Form.Item>
                <Form.Item>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            data-testid="post-draft-submit"
                            type="default"
                            onClick={() => void saveDraft()}
                            loading={savingDraft}
                            block
                            size="large"
                            className="!h-12 !rounded-xl !font-semibold"
                        >
                            Save draft
                        </Button>
                        <Button
                            data-testid="post-submit"
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                            className="!h-12 !rounded-xl !font-semibold"
                        >
                            Publish post
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default PostForm;
