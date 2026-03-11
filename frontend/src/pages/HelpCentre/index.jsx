import './index.css';
import './light.css';
import './dark.css';
import './mlight.css';
import './mdark.css';

export default function HelpCentre() {
    return (
        <div className="help-root">
            <div className="help-container">
                <h1 className="help-title">Help Centre 📧</h1>
                <p className="help-desc">How can we help you today? Browse our FAQs or contact support.</p>
                <div className="help-placeholder">
                    <span className="help-placeholdertext">Help articles coming soon...</span>
                </div>
            </div>
        </div>
    );
}
