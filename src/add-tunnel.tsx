import {
  Icon,
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  openCommandPreferences,
  Clipboard,
  useNavigation,
} from "@raycast/api";
import { useExec, useForm } from "@raycast/utils";
import ngrok from "ngrok";
import { config } from "./config";

interface FormValues {
  port: string;
  domain?: string;
}

type Props = {
  revalidate: () => void;
};

export default function AddTunnel({ revalidate }: Props) {
  const { pop } = useNavigation();

  const { data: ngrokBin } = useExec("which", ["ngrok"]);

  const { handleSubmit, itemProps } = useForm<FormValues>({
    async onSubmit(values) {
      if (!ngrokBin) {
        await showToast({
          style: Toast.Style.Failure,
          title: `Couldn't found ngrok CLI`,
        });
        return;
      }
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: `Connecting Tunnel to Port ${values.port}...`,
      });

      try {
        const tunnel = await ngrok.connect({
          addr: values.port,
          authtoken: config.authToken,
          binPath: () => ngrokBin.replace("/ngrok", ""),
        });

        await Clipboard.copy(tunnel);

        toast.style = Toast.Style.Success;
        toast.title = `Tunnel created on ${tunnel}!`;
        toast.message = "URL copied to clipboard.";

        revalidate();

        pop();
      } catch (err) {
        console.log(err);
        toast.style = Toast.Style.Failure;
        toast.title = "Failed to create tunnel";
        if (err instanceof Error) {
          toast.message = err.message;
        }
      }
    },
    validation: {
      port: (value) => {
        if (value === "") return "Required field.";
        const nValue = Number(value);
        if (isNaN(nValue) || nValue > 65535) return "Enter a valid port.";
      },
      domain(value) {
        if (value) {
          const regex = /^(?:[a-zA-Z0-9-]{1,63}\.){1,126}(?:[a-zA-Z]{2,63})$/;
          if (!regex.test(value)) {
            return "Enter a valid domain.";
          }
        }
      },
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Tunnel" icon={Icon.Plus} onSubmit={handleSubmit} />
          <Action.OpenInBrowser title="Open Dashboard" url="https://dashboard.ngrok.com/" />
          <Action title="Change API Key" icon={Icon.Key} onAction={() => openCommandPreferences()} />
        </ActionPanel>
      }
    >
      <Form.Description text="Create an ngrok tunnel" />
      <Form.TextField title="Port" placeholder="Enter the localhost port to expose" {...itemProps.port} />
      <Form.TextField title="Domain" placeholder="(optional) Enter a custom domain" {...itemProps.domain} />
    </Form>
  );
}
