// Global type declarations for Google Identity Services
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string }) => void;
                    renderButton: (element: HTMLElement, config: {
                        text?: string;
                        theme?: string;
                        size?: string;
                        type?: string;
                        shape?: string;
                        logo_alignment?: string;
                        width?: number;
                        locale?: string;
                    }) => void;
                    disableAutoSelect?: () => void;
                    prompt: () => void;
                };
            };
        };
    }
}
