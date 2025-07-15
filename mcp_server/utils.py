import re

def extract_cypher(text: str) -> str:
    """Extract and format Cypher query from text, handling code blocks and special characters.

    This function performs two main operations:
    1. Extracts Cypher code from within triple backticks (```), if present
    2. Automatically adds backtick quotes around multi-word identifiers:
       - Node labels (e.g., ":Data Science" becomes ":`Data Science`")
       - Property keys (e.g., "first name:" becomes "`first name`:")
       - Relationship types (e.g., "[:WORKS WITH]" becomes "[:`WORKS WITH`]")

    Args:
        text (str): Raw text that may contain Cypher code, either within triple
                   backticks or as plain text.

    Returns:
        str: Properly formatted Cypher query with correct backtick quoting.
    """
    # Extract Cypher code enclosed in triple backticks
    pattern = r"```(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL)
    cypher_query = matches[0] if matches else text
    # Quote node labels in backticks if they contain spaces and are not already quoted
    cypher_query = re.sub(
        r":\s*(?!`\s*)(\s*)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)(?!\s*`)(\s*)",
        r":`\2`",
        cypher_query,
    )
    # Quote property keys in backticks if they contain spaces and are not already quoted
    cypher_query = re.sub(
        r"([,{]\s*)(?!`)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)(?!`)(\s*:)",
        r"\1`\2`\3",
        cypher_query,
    )
    # Quote relationship types in backticks if they contain spaces and are not already quoted
    cypher_query = re.sub(
        r"(\[\s*[a-zA-Z0-9_]*\s*:\s*)(?!`)([a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)+)(?!`)(\s*(?:\]|-))",
        r"\1`\2`\3",
        cypher_query,
    )
    return cypher_query

def parse_code(llm_response: str, code = "python"):
    """
    Extract and return the Python function from the LLM response.

    Args:
        llm_response (str): The raw content of the LLM's response (should contain a Python function).

    Returns:
        function: A callable function defined in the extracted code.
    """
    # Remove Markdown-style code blocks
    code = re.search(rf"```(?:{code})?\n(.*?)```", llm_response, re.DOTALL)
    if code:
        code_str = code.group(1)
    else:
        # Fallback: use full response if no code block
        code_str = llm_response.strip()
    return code_str
    # Create a namespace for executing the code
    local_namespace = {}

    try:
        exec(code_str, {}, local_namespace)
    except Exception as e:
        raise RuntimeError(f"Failed to execute generated code:\n{e}")

    # # Find and return the first function defined in the code
    # for obj in local_namespace.values():
    #     if callable(obj):
    #         return obj

    # raise RuntimeError("No callable function found in the generated code.")
