import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export const LESSON_TYPE_OPTIONS = [
    { value: 'text', label: 'Text Lesson', icon: 'T', description: 'Concept notes and written explanations.', group: 'Lectures' },
    { value: 'video', label: 'Video Lecture', icon: 'V', description: 'Recorded classes and demo walkthroughs.', group: 'Lectures' },
    { value: 'pdf', label: 'PDF Notes', icon: 'P', description: 'Reading material, notes, and handouts.', group: 'Lectures' },
    { value: 'ppt', label: 'PPT Slides', icon: 'S', description: 'Slide decks for structured lessons.', group: 'Lectures' },
    { value: 'markdown_code', label: 'Markdown / Code', icon: 'C', description: 'Explanation with code blocks or snippets.', group: 'Lectures' },
    { value: 'dpp', label: 'DPP', icon: 'D', description: 'Daily practice problems with supporting files.', group: 'Practice & Evaluation' },
    { value: 'quiz', label: 'Quiz', icon: 'Q', description: 'Objective checks with answer validation.', group: 'Practice & Evaluation' },
    { value: 'assignment_manual', label: 'Manual Assignment', icon: 'M', description: 'Teacher-reviewed assignment submissions.', group: 'Practice & Evaluation' },
    { value: 'assignment_autograded', label: 'Autograded Assignment', icon: 'A', description: 'Code assignment checked inside an isolated container.', group: 'Practice & Evaluation' },
];

export const INITIAL_LESSON_FORM = {
    title: '',
    content_type: 'text',
    content: '',
    file_url: '',
    order_index: 0,
    code_template: '',
    quiz_data: '',
    autograde_tests: '',
    autograde_language: 'python',
};

export function buildLessonPayload(lessonForm) {
    return {
        title: lessonForm.title,
        content_type: lessonForm.content_type,
        content: lessonForm.content || null,
        video_url: lessonForm.content_type === 'video' ? (lessonForm.file_url || null) : null,
        pdf_url: ['pdf', 'dpp'].includes(lessonForm.content_type) ? (lessonForm.file_url || null) : null,
        ppt_url: lessonForm.content_type === 'ppt' ? (lessonForm.file_url || null) : null,
        code_template: ['markdown_code', 'assignment_autograded'].includes(lessonForm.content_type) ? (lessonForm.code_template || null) : null,
        quiz_data: lessonForm.content_type === 'quiz' ? (lessonForm.quiz_data || null) : null,
        autograde_tests: lessonForm.content_type === 'assignment_autograded' ? (lessonForm.autograde_tests || null) : null,
        autograde_language: lessonForm.content_type === 'assignment_autograded' ? (lessonForm.autograde_language || 'python') : null,
        order_index: parseInt(lessonForm.order_index, 10) || 0,
    };
}

export function mapLessonToForm(lesson) {
    return {
        title: lesson.title,
        content_type: lesson.content_type,
        content: lesson.content || '',
        file_url: lesson.video_url || lesson.pdf_url || lesson.ppt_url || '',
        order_index: lesson.order_index,
        code_template: lesson.code_template || '',
        quiz_data: lesson.quiz_data || '',
        autograde_tests: lesson.autograde_tests || '',
        autograde_language: lesson.autograde_language || 'python',
    };
}

function FileFields({ value, onChange, onFileUpload, uploading, accept, label, hint }) {
    return (
        <div className="lessoncomposer-section">
            <label className="lessoncomposer-label">{label}</label>
            <input
                className="lessoncomposer-input"
                type="file"
                accept={accept}
                onChange={e => onFileUpload(e.target.files?.[0], 'materials', url => onChange('file_url', url))}
                disabled={uploading}
            />
            <input
                className="lessoncomposer-input"
                type="text"
                placeholder="Or paste file URL"
                value={value.file_url}
                onChange={e => onChange('file_url', e.target.value)}
            />
            {hint && <p className="lessoncomposer-hint">{hint}</p>}
        </div>
    );
}

function TextContentFields({ value, onChange, label, placeholder }) {
    return (
        <div className="lessoncomposer-section">
            <label className="lessoncomposer-label">{label}</label>
            <textarea
                className="lessoncomposer-textarea"
                value={value.content}
                onChange={e => onChange('content', e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

function MarkdownCodeFields({ value, onChange }) {
    return (
        <>
            <TextContentFields value={value} onChange={onChange} label="Explanation / Notes" placeholder="Add markdown-style explanation or context" />
            <div className="lessoncomposer-section">
                <label className="lessoncomposer-label">Code / Markdown Block</label>
                <textarea
                    className="lessoncomposer-textarea lessoncomposer-codearea"
                    value={value.code_template}
                    onChange={e => onChange('code_template', e.target.value)}
                    placeholder="Paste markdown or code here"
                />
            </div>
        </>
    );
}

function QuizFields({ value, onChange }) {
    return (
        <div className="lessoncomposer-section">
            <label className="lessoncomposer-label">Quiz JSON</label>
            <textarea
                className="lessoncomposer-textarea lessoncomposer-codearea"
                value={value.quiz_data}
                onChange={e => onChange('quiz_data', e.target.value)}
                placeholder='{"questions":[{"prompt":"2+2?","options":["3","4"],"answer_index":1}]}'
            />
            <p className="lessoncomposer-hint">Use `questions`, `options`, and `answer_index` for each quiz item.</p>
        </div>
    );
}

function ManualAssignmentFields({ value, onChange }) {
    return (
        <>
            <TextContentFields value={value} onChange={onChange} label="Assignment Prompt" placeholder="Describe the assignment and evaluation criteria" />
            <div className="lessoncomposer-section">
                <label className="lessoncomposer-label">Optional Starter Code</label>
                <textarea
                    className="lessoncomposer-textarea lessoncomposer-codearea"
                    value={value.code_template}
                    onChange={e => onChange('code_template', e.target.value)}
                    placeholder="Optional starter template for learners"
                />
            </div>
        </>
    );
}

function AutogradedAssignmentFields({ value, onChange }) {
    return (
        <>
            <TextContentFields value={value} onChange={onChange} label="Assignment Prompt" placeholder="Describe the problem and expected behavior" />
            <div className="lessoncomposer-grid">
                <div className="lessoncomposer-section">
                    <label className="lessoncomposer-label">Language</label>
                    <select className="lessoncomposer-input" value={value.autograde_language} onChange={e => onChange('autograde_language', e.target.value)}>
                        <option value="python">Python</option>
                    </select>
                </div>
            </div>
            <div className="lessoncomposer-section">
                <label className="lessoncomposer-label">Starter Code</label>
                <textarea
                    className="lessoncomposer-textarea lessoncomposer-codearea"
                    value={value.code_template}
                    onChange={e => onChange('code_template', e.target.value)}
                    placeholder="Provide starter code for the learner"
                />
            </div>
            <div className="lessoncomposer-section">
                <label className="lessoncomposer-label">Autograder Tests JSON</label>
                <textarea
                    className="lessoncomposer-textarea lessoncomposer-codearea"
                    value={value.autograde_tests}
                    onChange={e => onChange('autograde_tests', e.target.value)}
                    placeholder='{"test_cases":[{"input":"1 2\n","expected_output":"3"}]}'
                />
                <p className="lessoncomposer-hint">v1 uses isolated Docker execution for Python stdin/stdout test cases.</p>
            </div>
        </>
    );
}

function renderTypeFields(props) {
    const { value } = props;

    switch (value.content_type) {
        case 'video':
            return <FileFields {...props} accept="video/*" label="Video File / URL" hint="Supports uploaded videos and embeddable links." />;
        case 'pdf':
            return <FileFields {...props} accept=".pdf,application/pdf" label="PDF File / URL" hint="Upload notes, references, or reading material." />;
        case 'ppt':
            return <FileFields {...props} accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" label="PPT File / URL" hint="Upload slides for the lesson." />;
        case 'dpp':
            return (
                <>
                    <TextContentFields {...props} label="DPP Instructions" placeholder="Explain what the learner should practice." />
                    <FileFields {...props} accept=".pdf,application/pdf" label="DPP PDF / URL" hint="Upload the practice sheet as a PDF." />
                </>
            );
        case 'markdown_code':
            return <MarkdownCodeFields {...props} />;
        case 'quiz':
            return <QuizFields {...props} />;
        case 'assignment_manual':
            return <ManualAssignmentFields {...props} />;
        case 'assignment_autograded':
            return <AutogradedAssignmentFields {...props} />;
        case 'text':
        default:
            return <TextContentFields {...props} label="Lesson Content" placeholder="Write the lesson content here" />;
    }
}

export default function LessonComposer({
    value,
    onChange,
    onSubmit,
    onFileUpload,
    uploading = false,
    submitLabel = 'Save Lesson',
    heading = 'Lesson Builder',
    subheading = 'Choose a content type and fill the required fields.',
}) {
    const handleFieldChange = (field, nextValue) => {
        onChange({ ...value, [field]: nextValue });
    };

    const groupedOptions = LESSON_TYPE_OPTIONS.reduce((acc, option) => {
        if (!acc[option.group]) acc[option.group] = [];
        acc[option.group].push(option);
        return acc;
    }, {});

    return (
        <form onSubmit={onSubmit} className="lessoncomposer-root fade-in">
            <div className="lessoncomposer-header">
                <h4>{heading}</h4>
                <p>{subheading}</p>
            </div>

            <div className="lessoncomposer-grid">
                <div className="lessoncomposer-section">
                    <label className="lessoncomposer-label">Title</label>
                    <input className="lessoncomposer-input" type="text" value={value.title} onChange={e => handleFieldChange('title', e.target.value)} required />
                </div>
                <div className="lessoncomposer-section">
                    <label className="lessoncomposer-label">Order</label>
                    <input className="lessoncomposer-input" type="number" value={value.order_index} onChange={e => handleFieldChange('order_index', e.target.value)} />
                </div>
                <div className="lessoncomposer-section">
                    <label className="lessoncomposer-label">Selected Type</label>
                    <div className="lessoncomposer-selectedtype">{LESSON_TYPE_OPTIONS.find(option => option.value === value.content_type)?.label || 'Text Lesson'}</div>
                </div>
            </div>

            <div className="lessoncomposer-typegroups">
                {Object.entries(groupedOptions).map(([groupName, options]) => (
                    <div key={groupName} className="lessoncomposer-typegroup">
                        <div className="lessoncomposer-grouplabel">{groupName}</div>
                        <div className="lessoncomposer-typegrid">
                            {options.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`lessoncomposer-typecard ${value.content_type === option.value ? 'active' : ''}`}
                                    onClick={() => handleFieldChange('content_type', option.value)}
                                >
                                    <span className="lessoncomposer-typeicon">{option.icon}</span>
                                    <span className="lessoncomposer-typetext">
                                        <strong>{option.label}</strong>
                                        <small>{option.description}</small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {renderTypeFields({
                value,
                onChange: handleFieldChange,
                onFileUpload,
                uploading,
            })}

            <button type="submit" className="lessoncomposer-submit">{submitLabel}</button>
        </form>
    );
}
