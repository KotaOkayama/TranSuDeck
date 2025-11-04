from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
import re
from typing import List
from app.models.slide import Slide

class PPTXGenerator:
    def __init__(self):
        self.prs = None
    
    def create_presentation(self, slides: List[Slide], output_path: str):
        """Create PowerPoint presentation from slides"""
        self.prs = Presentation()
        
        # 16:9 ワイドスクリーン設定
        self.prs.slide_width = Inches(13.333)   # 16:9 の幅
        self.prs.slide_height = Inches(7.5)     # 16:9 の高さ
        
        for slide_data in slides:
            self._add_slide_from_markdown(slide_data.content)
        
        self.prs.save(output_path)
    
    def _add_slide_from_markdown(self, markdown_content: str):
        """Convert markdown content to PowerPoint slide"""
        # Create blank slide
        blank_slide_layout = self.prs.slide_layouts[6]  # Blank layout
        slide = self.prs.slides.add_slide(blank_slide_layout)
        
        # Parse markdown content
        lines = markdown_content.strip().split('\n')
        
        # Add title text box (16:9 対応で幅を調整)
        title_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(0.5),
            Inches(12.333), Inches(1)  # 幅を広げる
        )
        title_frame = title_box.text_frame
        title_frame.word_wrap = True
        
        # Add content text box (16:9 対応で幅を調整)
        content_box = slide.shapes.add_textbox(
            Inches(0.5), Inches(1.8),
            Inches(12.333), Inches(5)  # 幅を広げる
        )
        content_frame = content_box.text_frame
        content_frame.word_wrap = True
        
        title_set = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Handle headers as title
            if line.startswith('##'):
                if not title_set:
                    title_text = line.replace('##', '').strip()
                    p = title_frame.paragraphs[0]
                    p.text = title_text
                    p.font.size = Pt(36)  # タイトルサイズを少し大きく
                    p.font.bold = True
                    p.font.color.rgb = RGBColor(0, 0, 0)
                    title_set = True
                else:
                    # Additional headers go to content
                    p = content_frame.add_paragraph()
                    p.text = line.replace('##', '').strip()
                    p.font.size = Pt(24)  # サブタイトルサイズを調整
                    p.font.bold = True
                    p.space_before = Pt(12)
            
            # Handle bullet points
            elif line.startswith('-') or line.startswith('*'):
                bullet_text = re.sub(r'^[-*]\s*', '', line)
                p = content_frame.add_paragraph()
                p.text = bullet_text
                p.level = 0
                p.font.size = Pt(20)  # 本文サイズを調整
                p.space_before = Pt(6)
            
            # Handle numbered lists
            elif re.match(r'^\d+\.', line):
                list_text = re.sub(r'^\d+\.\s*', '', line)
                p = content_frame.add_paragraph()
                p.text = list_text
                p.level = 0
                p.font.size = Pt(20)
                p.space_before = Pt(6)
            
            # Regular text
            else:
                if not title_set:
                    # First line becomes title if no header found
                    p = title_frame.paragraphs[0]
                    p.text = line
                    p.font.size = Pt(36)
                    p.font.bold = True
                    title_set = True
                else:
                    p = content_frame.add_paragraph()
                    p.text = line
                    p.font.size = Pt(20)
                    p.space_before = Pt(6)
