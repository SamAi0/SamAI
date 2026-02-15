// Test the improved code block extraction function
const extractCodeBlocks = (content) => {
  const codeBlocks = []
  const codeBlockRegex = /```(\w*)\s*\n([\s\S]*?)\n```/g
  let match

  console.log('Testing content:', content.substring(0, 100) + '...')
  console.log('Regex pattern:', codeBlockRegex)

  while ((match = codeBlockRegex.exec(content)) !== null) {
    console.log('Found match')
    const language = match[1] || 'plaintext'
    const code = match[2]

    console.log('Language:', language)

    // Try to infer file path from surrounding text with improved matching
    // Look for various patterns indicating file creation
    const filePathPatterns = [
      /(?:creating|generating|new file|create)\s+(?:a|an)?\s+.*?\b([a-zA-Z0-9/_\-\.]+(?:\.[a-z]+)?)\b/i,
      /(?:todo|to-do|task|list).*?(?:in\s+)?([a-zA-Z0-9/_\-\.]+(?:\.[a-z]+)?)/i,
      /(?:html|javascript|typescript|css|python|java)(?:\s+(?:file|program|app|project))?/i
    ];
    
    let filePathMatch = null;
    let matchedPatternIndex = -1;
    
    for (let i = 0; i < filePathPatterns.length; i++) {
      const matchResult = content.substring(0, match.index).match(filePathPatterns[i]);
      if (matchResult && matchResult[1]) { // Make sure we have a capture group
        filePathMatch = matchResult;
        matchedPatternIndex = i;
        break;
      }
    }
    
    console.log('FilePath matches found:', filePathPatterns.map((pattern, i) => 
      ({ pattern: pattern.toString(), match: content.substring(0, match.index).match(pattern), index: i })
    ));
    
    // Default file naming based on content analysis
    let fileName = `generated.${language}`;
    let filePath = `src/${fileName}`;
    
    if (filePathMatch && filePathMatch[1] && filePathMatch[1].length > 1) {
      // Validate that the captured path looks reasonable
      const capturedPath = filePathMatch[1];
      if (capturedPath.includes('.') || capturedPath.includes('/')) {
        fileName = capturedPath.split('/').pop() || `file.${language}`;
        filePath = capturedPath;
      } else {
        // Just a word, probably not a valid path
        filePathMatch = null;
      }
    }
    
    if (!filePathMatch) {
      // Analyze the code content to suggest appropriate filename
      if (language === 'html' && code.toLowerCase().includes('<!doctype')) {
        // HTML document - check if it's a todo list
        if (code.toLowerCase().includes('todo') || code.toLowerCase().includes('task') || code.toLowerCase().includes('list')) {
          fileName = 'todo-list.html';
          filePath = 'src/pages/todo-list.html';
        } else {
          fileName = 'index.html';
          filePath = 'src/index.html';
        }
      } else if (language === 'html') {
        fileName = 'component.html';
        filePath = 'src/components/component.html';
      } else {
        fileName = `generated.${language}`;
        filePath = `src/${fileName}`;
      }
    }

    console.log('Final fileName:', fileName);
    console.log('Final filePath:', filePath);

    codeBlocks.push({
      fileName,
      filePath,
      content: code,
      language,
      action: 'create'
    })
  }

  console.log('Extracted code blocks:', codeBlocks)
  return codeBlocks
}

// Test with your specific prompt
const testContent1 = `Create me a to do list in Html The to do list content programming languages learning

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>Programming Languages Todo List</title>
</head>
<body>
    <h1>Programming Languages Learning Tracker</h1>
    <ul>
        <li>JavaScript - In Progress</li>
        <li>Python - Not Started</li>
        <li>TypeScript - Completed</li>
    </ul>
</body>
</html>
\`\`\``

console.log('=== TESTING YOUR PROMPT ===')
const result1 = extractCodeBlocks(testContent1)
console.log('Result 1:', result1)