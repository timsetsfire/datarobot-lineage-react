import re

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
