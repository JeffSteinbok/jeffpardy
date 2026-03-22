import * as React from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from "@codemirror/language";

export interface IJsonEditorProps {
    defaultValue: string;
    onChange: (value: string) => void;
}

export class JsonEditor extends React.Component<IJsonEditorProps> {
    private editorRef = React.createRef<HTMLDivElement>();
    private view: EditorView | null = null;

    componentDidMount() {
        if (this.editorRef.current) {
            const state = EditorState.create({
                doc: this.props.defaultValue,
                extensions: [
                    lineNumbers(),
                    highlightActiveLine(),
                    history(),
                    bracketMatching(),
                    foldGutter({ openText: "▼", closedText: "▶" }),
                    json(),
                    oneDark,
                    syntaxHighlighting(defaultHighlightStyle),
                    keymap.of([...defaultKeymap, ...historyKeymap]),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            this.props.onChange(update.state.doc.toString());
                        }
                    }),
                    EditorView.theme({
                        "&": { height: "100%", fontSize: "13px" },
                        ".cm-scroller": { overflow: "auto" },
                        ".cm-content": { fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace" },
                        ".cm-gutters": {
                            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace",
                            backgroundColor: "#060833",
                        },
                        "&.cm-editor": { backgroundColor: "#060a40" },
                        ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
                        ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.04)" },
                    }),
                ],
            });

            this.view = new EditorView({
                state,
                parent: this.editorRef.current,
            });
        }
    }

    componentWillUnmount() {
        this.view?.destroy();
    }

    render() {
        return (
            <div
                ref={this.editorRef}
                style={{
                    flex: 1,
                    minHeight: 0,
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "6px",
                    overflow: "hidden",
                }}
            />
        );
    }
}
