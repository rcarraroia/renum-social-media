"""
Testes unitários para app/utils/sanitize.py

Valida funções de sanitização de inputs para prevenir injection attacks.
"""
import pytest
from app.utils.sanitize import (
    sanitize_string,
    sanitize_sql_like,
    sanitize_filename,
    sanitize_html,
    sanitize_json_string,
    validate_date_format,
    validate_datetime_format,
    sanitize_platform_name,
    sanitize_enum_value,
)


class TestSanitizeString:
    """Testes para sanitize_string"""
    
    def test_sanitize_normal_string(self):
        """Testa sanitização de string normal"""
        result = sanitize_string("Hello World")
        assert result == "Hello World"
    
    def test_sanitize_string_with_control_chars(self):
        """Testa remoção de caracteres de controle"""
        result = sanitize_string("Hello\x00\x01World\x1F")
        assert result == "HelloWorld"
    
    def test_sanitize_string_with_max_length(self):
        """Testa limitação de comprimento"""
        result = sanitize_string("Hello World", max_length=5)
        assert result == "Hello"
    
    def test_sanitize_string_with_whitespace(self):
        """Testa remoção de espaços extras"""
        result = sanitize_string("  Hello World  ")
        assert result == "Hello World"
    
    def test_sanitize_non_string_returns_empty(self):
        """Testa que não-string retorna vazio"""
        result = sanitize_string(123)
        assert result == ""
    
    def test_sanitize_preserves_newline_and_tab(self):
        """Testa que newline e tab são preservados"""
        result = sanitize_string("Hello\nWorld\tTest")
        assert result == "Hello\nWorld\tTest"


class TestSanitizeSqlLike:
    """Testes para sanitize_sql_like"""
    
    def test_sanitize_sql_like_percent(self):
        """Testa escape de %"""
        result = sanitize_sql_like("test%value")
        assert result == "test\\%value"
    
    def test_sanitize_sql_like_underscore(self):
        """Testa escape de _"""
        result = sanitize_sql_like("test_value")
        assert result == "test\\_value"
    
    def test_sanitize_sql_like_backslash(self):
        """Testa escape de \\"""
        result = sanitize_sql_like("test\\value")
        assert result == "test\\\\value"
    
    def test_sanitize_sql_like_bracket(self):
        """Testa escape de ["""
        result = sanitize_sql_like("test[value]")
        assert result == "test\\[value]"
    
    def test_sanitize_sql_like_multiple_chars(self):
        """Testa escape de múltiplos caracteres"""
        result = sanitize_sql_like("test%_\\[value")
        assert result == "test\\%\\_\\\\\\[value"


class TestSanitizeFilename:
    """Testes para sanitize_filename"""
    
    def test_sanitize_filename_normal(self):
        """Testa nome de arquivo normal"""
        result = sanitize_filename("document.pdf")
        assert result == "document.pdf"
    
    def test_sanitize_filename_removes_invalid_chars(self):
        """Testa remoção de caracteres inválidos"""
        result = sanitize_filename('file<>:"/\\|?*.txt')
        assert result == "file.txt"
    
    def test_sanitize_filename_removes_leading_dots(self):
        """Testa remoção de pontos no início"""
        result = sanitize_filename("...file.txt")
        assert result == "file.txt"
    
    def test_sanitize_filename_removes_trailing_dots(self):
        """Testa remoção de pontos no fim"""
        result = sanitize_filename("file.txt...")
        assert result == "file.txt"
    
    def test_sanitize_filename_max_length(self):
        """Testa limitação de comprimento (255 chars)"""
        long_name = "a" * 300 + ".txt"
        result = sanitize_filename(long_name)
        assert len(result) == 255


class TestSanitizeHtml:
    """Testes para sanitize_html"""
    
    def test_sanitize_html_removes_tags(self):
        """Testa remoção de tags HTML"""
        result = sanitize_html("<p>Hello <b>World</b></p>")
        assert result == "Hello World"
    
    def test_sanitize_html_escapes_special_chars(self):
        """Testa escape de caracteres especiais"""
        result = sanitize_html('Test & "quotes" <>')
        assert result == "Test &amp; &quot;quotes&quot; &lt;&gt;"
    
    def test_sanitize_html_escapes_single_quote(self):
        """Testa escape de aspas simples"""
        result = sanitize_html("It's a test")
        assert result == "It&#x27;s a test"
    
    def test_sanitize_html_removes_script_tags(self):
        """Testa remoção de tags script"""
        result = sanitize_html("<script>alert('xss')</script>Hello")
        assert result == "alert(&#x27;xss&#x27;)Hello"


class TestSanitizeJsonString:
    """Testes para sanitize_json_string"""
    
    def test_sanitize_json_string_normal(self):
        """Testa string normal"""
        result = sanitize_json_string("Hello World")
        assert result == "Hello World"
    
    def test_sanitize_json_string_removes_control_chars(self):
        """Testa remoção de caracteres de controle"""
        result = sanitize_json_string("Hello\x00\x01World\x1F")
        assert result == "HelloWorld"
    
    def test_sanitize_json_string_converts_non_string(self):
        """Testa conversão de não-string"""
        result = sanitize_json_string(123)
        assert result == "123"
    
    def test_sanitize_json_string_preserves_unicode(self):
        """Testa preservação de unicode"""
        result = sanitize_json_string("Olá Mundo 你好")
        assert result == "Olá Mundo 你好"


class TestValidateDateFormat:
    """Testes para validate_date_format"""
    
    def test_validate_date_format_valid(self):
        """Testa formato válido YYYY-MM-DD"""
        assert validate_date_format("2024-01-15") is True
    
    def test_validate_date_format_invalid_format(self):
        """Testa formato inválido"""
        assert validate_date_format("15-01-2024") is False
        assert validate_date_format("2024/01/15") is False
        assert validate_date_format("2024-1-15") is False
    
    def test_validate_date_format_invalid_values(self):
        """Testa valores inválidos"""
        assert validate_date_format("2024-13-01") is True  # Regex não valida valores
        assert validate_date_format("2024-00-01") is True  # Apenas formato
    
    def test_validate_date_format_empty_string(self):
        """Testa string vazia"""
        assert validate_date_format("") is False


class TestValidateDatetimeFormat:
    """Testes para validate_datetime_format"""
    
    def test_validate_datetime_format_valid_basic(self):
        """Testa formato básico ISO 8601"""
        assert validate_datetime_format("2024-01-15T10:30:00") is True
    
    def test_validate_datetime_format_valid_with_z(self):
        """Testa formato com Z (UTC)"""
        assert validate_datetime_format("2024-01-15T10:30:00Z") is True
    
    def test_validate_datetime_format_valid_with_timezone(self):
        """Testa formato com timezone"""
        assert validate_datetime_format("2024-01-15T10:30:00+00:00") is True
        assert validate_datetime_format("2024-01-15T10:30:00-03:00") is True
    
    def test_validate_datetime_format_valid_with_milliseconds(self):
        """Testa formato com milissegundos"""
        assert validate_datetime_format("2024-01-15T10:30:00.123Z") is True
    
    def test_validate_datetime_format_invalid(self):
        """Testa formatos inválidos"""
        assert validate_datetime_format("2024-01-15 10:30:00") is False
        assert validate_datetime_format("2024-01-15") is False
        assert validate_datetime_format("10:30:00") is False


class TestSanitizePlatformName:
    """Testes para sanitize_platform_name"""
    
    def test_sanitize_platform_name_lowercase(self):
        """Testa conversão para lowercase"""
        result = sanitize_platform_name("Instagram")
        assert result == "instagram"
    
    def test_sanitize_platform_name_removes_special_chars(self):
        """Testa remoção de caracteres especiais"""
        result = sanitize_platform_name("Face-Book!")
        assert result == "facebook"
    
    def test_sanitize_platform_name_preserves_numbers(self):
        """Testa preservação de números"""
        result = sanitize_platform_name("TikTok2024")
        assert result == "tiktok2024"
    
    def test_sanitize_platform_name_removes_spaces(self):
        """Testa remoção de espaços"""
        result = sanitize_platform_name("  You Tube  ")
        assert result == "youtube"


class TestSanitizeEnumValue:
    """Testes para sanitize_enum_value"""
    
    def test_sanitize_enum_value_valid(self):
        """Testa valor válido"""
        allowed = ["draft", "published", "archived"]
        result = sanitize_enum_value("published", allowed)
        assert result == "published"
    
    def test_sanitize_enum_value_invalid(self):
        """Testa valor inválido"""
        allowed = ["draft", "published", "archived"]
        result = sanitize_enum_value("deleted", allowed)
        assert result is None
    
    def test_sanitize_enum_value_case_sensitive(self):
        """Testa que é case-sensitive"""
        allowed = ["draft", "published", "archived"]
        result = sanitize_enum_value("Published", allowed)
        assert result is None
    
    def test_sanitize_enum_value_empty_list(self):
        """Testa lista vazia"""
        result = sanitize_enum_value("test", [])
        assert result is None
