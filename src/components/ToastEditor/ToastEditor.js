"use client";

import { useEffect, useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "./ToastEditor.css"


export default function ToastEditor({content, setContent}){
    const editorRef = useRef(null);


    const handleChange = () => {
        if (editorRef.current) {
          const instance = editorRef.current.getInstance();
          
          if (instance.isMarkdownMode()) {
            setContent(instance.getMarkdown());
          } else {
            setContent(instance.getHTML());
          }
        }
      };
    
      const switchToEditorMode = () => {
        if (editorRef.current) {
          const instance = editorRef.current.getInstance();
          
          if (instance.isMarkdownMode()) {
            const htmlSource = instance.getMarkdown(); 
            
            instance.changeMode('wysiwyg');
            
            instance.setHTML(htmlSource);
          }
        }
      };
    
      const switchToHtmlMode = () => {
        if (editorRef.current) {
          const instance = editorRef.current.getInstance();
          
          if (!instance.isMarkdownMode()) {
            const htmlSource = instance.getHTML(); 
            
            instance.changeMode('markdown');
            
            instance.setMarkdown(htmlSource);
          }
        }
      };

    return(
        <div >
           <Editor
                ref={editorRef}
                initialValue={content || ' '}
                height="400px"
                previewStyle="tab"
                initialEditType="wysiwyg"
                useCommandShortcut={true}
                onChange={handleChange}
                hideModeSwitch={true}
            />
        <div className="custom-editor-tabs">
                <button 
                    type="button"
                    className={`custom-tab-btn`}
                    onClick={switchToEditorMode}
                >
                    Editor
                </button>
                <button 
                    type="button"
                    className={`custom-tab-btn`}
                    onClick={switchToHtmlMode}
                >
                    HTML
                </button>
            </div>
        </div>
    )


}